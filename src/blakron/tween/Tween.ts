import { ticker } from '@blakron/core';
import type { EaseFunction, TweenOptions } from './types.js';
import { Ease } from './Ease.js';

// ── Step types ────────────────────────────────────────────────────────────────

type StepType = 'to' | 'from' | 'wait' | 'call' | 'set';

interface BaseStep {
	type: StepType;
	duration: number;
}

interface ToStep extends BaseStep {
	type: 'to';
	props: Record<string, number>;
	ease: EaseFunction;
	startValues?: Record<string, number>;
}

interface FromStep extends BaseStep {
	type: 'from';
	props: Record<string, number>;
	ease: EaseFunction;
	endValues?: Record<string, number>;
}

interface WaitStep extends BaseStep {
	type: 'wait';
}

interface CallStep extends BaseStep {
	type: 'call';
	fn: (...args: unknown[]) => void;
	thisObj?: object;
	params: unknown[];
}

interface SetStep extends BaseStep {
	type: 'set';
	props: Record<string, unknown>;
}

type TweenStep = ToStep | FromStep | WaitStep | CallStep | SetStep;

// ── Global tween registry ─────────────────────────────────────────────────────

const _activeTweens: Tween[] = [];
let _tickerRegistered = false;
let _globalPaused = false;
let _lastTimeStamp = 0;

/** WeakMap tracking active tween count per target — avoids polluting target objects. */
const _tweenCounts = new WeakMap<object, number>();

function _getTweenCount(target: object): number {
	return _tweenCounts.get(target) ?? 0;
}

function _incTweenCount(target: object): void {
	_tweenCounts.set(target, (_tweenCounts.get(target) ?? 0) + 1);
}

function _decTweenCount(target: object): void {
	const n = (_tweenCounts.get(target) ?? 1) - 1;
	if (n <= 0) _tweenCounts.delete(target);
	else _tweenCounts.set(target, n);
}

function _registerTicker(): void {
	if (_tickerRegistered) return;
	_tickerRegistered = true;
	ticker.startTick(_globalTick, null);
}

function _globalTick(timeStamp: number): boolean {
	if (_lastTimeStamp === 0) {
		_lastTimeStamp = timeStamp;
		return false;
	}
	const dt = timeStamp - _lastTimeStamp;
	_lastTimeStamp = timeStamp;

	if (_globalPaused) return false;

	const list = _activeTweens.slice();
	for (const tween of list) {
		tween._tick(dt);
	}
	return false;
}

function _addActive(tween: Tween): void {
	if (!_activeTweens.includes(tween)) {
		_activeTweens.push(tween);
		_registerTicker();
	}
}

function _removeActive(tween: Tween): void {
	const i = _activeTweens.indexOf(tween);
	if (i !== -1) _activeTweens.splice(i, 1);
}

// ── Object pool ───────────────────────────────────────────────────────────────

const _pool: Tween[] = [];

// ── Tween ─────────────────────────────────────────────────────────────────────

/**
 * Lightweight tween engine, Egret-compatible.
 *
 * @example
 * ```ts
 * Tween.get(sprite)
 *   .to({ x: 200, alpha: 0 }, 500, Ease.cubicOut)
 *   .wait(100)
 *   .call(() => console.log('done'));
 * ```
 */
export class Tween {
	// ── Static API ────────────────────────────────────────────────────────────

	/**
	 * Create (or reuse from pool) a Tween for the given target.
	 * @param props  Options: loop, ignoreGlobalPause, onChange, onChangeObj, paused, position
	 * @param override If true, removes existing tweens on the target before creating. Default: false.
	 */
	public static get(
		target: object,
		props?: TweenOptions & {
			onChange?: (tween: Tween) => void;
			onChangeObj?: object;
			paused?: boolean;
			position?: number;
		},
		override = false,
	): Tween {
		if (override) {
			Tween.removeTweens(target);
		}
		const tween = _pool.pop() ?? new Tween();
		tween._init(target, props);

		if (props?.paused) {
			// Don't add to active list — tween starts paused
		} else {
			_addActive(tween);
			// Track tween count via WeakMap (Egret compatibility: also set tween_count on target)
			_incTweenCount(target);
			const t = target as Record<string, unknown>;
			t.tween_count = _getTweenCount(target);
		}

		// Jump to initial position if specified
		if (props?.position != null) {
			tween._seekTo(props.position);
		}

		return tween;
	}

	/**
	 * Remove and recycle all tweens targeting the given object.
	 */
	public static removeTweens(target: object): void {
		const t = target as Record<string, unknown>;
		if (!t.tween_count && _getTweenCount(target) === 0) return;
		for (let i = _activeTweens.length - 1; i >= 0; i--) {
			if (_activeTweens[i]._target === target) {
				_activeTweens[i]._recycle();
				_activeTweens.splice(i, 1);
			}
		}
		_tweenCounts.delete(target);
		t.tween_count = 0;
	}

	/**
	 * Pause all tweens targeting the given object.
	 */
	public static pauseTweens(target: object): void {
		if (_getTweenCount(target) === 0) return;
		for (const tween of _activeTweens) {
			if (tween._target === target) tween.setPaused(true);
		}
	}

	/**
	 * Resume all tweens targeting the given object.
	 */
	public static resumeTweens(target: object): void {
		if (_getTweenCount(target) === 0) return;
		for (const tween of _activeTweens) {
			if (tween._target === target) tween.setPaused(false);
		}
	}

	/**
	 * Remove and recycle all active tweens.
	 */
	public static removeAllTweens(): void {
		for (const tween of _activeTweens) {
			if (tween._target) {
				_tweenCounts.delete(tween._target);
				(tween._target as Record<string, unknown>).tween_count = 0;
			}
			tween._recycle();
		}
		_activeTweens.length = 0;
	}

	/**
	 * Pause all active tweens globally.
	 */
	public static pauseAll(): void {
		_globalPaused = true;
	}

	/**
	 * Resume all tweens from global pause.
	 */
	public static resumeAll(): void {
		_globalPaused = false;
	}

	// ── Instance fields ───────────────────────────────────────────────────────

	_target?: object;
	private _steps: TweenStep[] = [];
	private _stepIndex = 0;
	private _stepElapsed = 0;
	private _paused = false;
	private _loop = false;
	private _ignoreGlobalPause = false;
	private _defaultEase: EaseFunction = Ease.linear;
	private _onChange?: (tween: Tween) => void;
	private _onChangeObj?: object;
	private _onLoopComplete?: (tween: Tween) => void;
	private _onLoopCompleteObj?: object;

	// ── Instance API ──────────────────────────────────────────────────────────

	/**
	 * Animate target properties to the given values over `duration` ms.
	 */
	public to(props: Record<string, number>, duration: number, ease?: EaseFunction): this {
		this._steps.push({
			type: 'to',
			props,
			duration,
			ease: ease ?? this._defaultEase,
		});
		return this;
	}

	/**
	 * Animate target properties from the given values to their current values.
	 */
	public from(props: Record<string, number>, duration: number, ease?: EaseFunction): this {
		this._steps.push({
			type: 'from',
			props,
			duration,
			ease: ease ?? this._defaultEase,
		});
		return this;
	}

	/**
	 * Wait for `duration` ms before proceeding to the next step.
	 * @param passive If true, properties are not updated during the wait.
	 */
	public wait(duration: number, _passive?: boolean): this {
		if (duration <= 0) return this;
		this._steps.push({ type: 'wait', duration });
		return this;
	}

	/**
	 * Call a function as a step in the tween sequence.
	 * @param callback The function to call.
	 * @param thisObj Optional `this` context for the callback.
	 * @param params Optional arguments to pass to the callback.
	 */
	public call(callback: (...args: unknown[]) => void, thisObj?: object, params?: unknown[]): this {
		this._steps.push({ type: 'call', duration: 0, fn: callback, thisObj, params: params ?? [] });
		return this;
	}

	/**
	 * Instantly set properties on the target as a step.
	 */
	public set(props: Record<string, unknown>): this {
		this._steps.push({ type: 'set', duration: 0, props });
		return this;
	}

	/**
	 * Set paused state. Egret-compatible: `setPaused(true)` pauses, `setPaused(false)` resumes.
	 */
	public setPaused(value: boolean): this {
		if (this._paused === value) return this;
		this._paused = value;
		if (value) {
			_removeActive(this);
		} else {
			_addActive(this);
		}
		return this;
	}

	/**
	 * Pause this tween immediately.
	 */
	public pause(): void {
		this.setPaused(true);
	}

	/**
	 * Resume this tween immediately.
	 */
	public resume(): void {
		this.setPaused(false);
	}

	/**
	 * Jump to an absolute time position (ms) in the tween sequence.
	 * Egret-compatible: `setPosition(value, actionsMode)` — actionsMode is ignored.
	 */
	public setPosition(value: number, _actionsMode = 1): void {
		this._seekTo(Math.max(0, value));
	}

	// ── Internal ──────────────────────────────────────────────────────────────

	public _tick(dt: number): void {
		if (this._paused) return;
		if (!this._ignoreGlobalPause && _globalPaused) return;
		if (!this._target || this._stepIndex >= this._steps.length) return;

		let remaining = dt;

		while (remaining > 0 && this._stepIndex < this._steps.length) {
			const step = this._steps[this._stepIndex];

			if (step.duration === 0) {
				this._executeInstantStep(step);
				this._stepIndex++;
				continue;
			}

			if (this._stepElapsed === 0) {
				this._initStep(step);
			}

			this._stepElapsed += remaining;

			if (this._stepElapsed >= step.duration) {
				remaining = this._stepElapsed - step.duration;
				this._stepElapsed = 0;
				this._applyStep(step, 1);
				this._stepIndex++;
			} else {
				const t = this._stepElapsed / step.duration;
				this._applyStep(step, t);
				remaining = 0;
			}
		}

		// Fire onChange callback
		if (this._onChange) {
			this._onChange.call(this._onChangeObj ?? this._target, this);
		}

		if (this._stepIndex >= this._steps.length) {
			if (this._loop) {
				this._stepIndex = 0;
				this._stepElapsed = 0;
				for (const step of this._steps) {
					if (step.type === 'to') step.startValues = undefined;
					if (step.type === 'from') step.endValues = undefined;
				}
				// Fire onLoopComplete callback (Egret LOOP_COMPLETE equivalent)
				if (this._onLoopComplete) {
					this._onLoopComplete.call(this._onLoopCompleteObj ?? this._target, this);
				}
			} else {
				// Decrement tween count
				if (this._target) {
					_decTweenCount(this._target);
					(this._target as Record<string, unknown>).tween_count = _getTweenCount(this._target);
				}
				_removeActive(this);
				_pool.push(this);
			}
		}
	}

	// ── Private ───────────────────────────────────────────────────────────────

	private _initStep(step: TweenStep): void {
		const target = this._target as Record<string, unknown>;
		if (step.type === 'to') {
			step.startValues = {};
			for (const key of Object.keys(step.props)) {
				step.startValues[key] = (target[key] as number) ?? 0;
			}
		} else if (step.type === 'from') {
			step.endValues = {};
			for (const key of Object.keys(step.props)) {
				step.endValues[key] = (target[key] as number) ?? 0;
				target[key] = step.props[key];
			}
		}
	}

	private _applyStep(step: TweenStep, rawT: number): void {
		const target = this._target as Record<string, unknown>;
		if (step.type === 'to') {
			const t = step.ease(rawT);
			const start = step.startValues!;
			for (const key of Object.keys(step.props)) {
				target[key] = start[key] + (step.props[key] - start[key]) * t;
			}
		} else if (step.type === 'from') {
			const t = step.ease(rawT);
			const end = step.endValues!;
			for (const key of Object.keys(step.props)) {
				target[key] = step.props[key] + (end[key] - step.props[key]) * t;
			}
		}
	}

	private _executeInstantStep(step: TweenStep): void {
		const target = this._target as Record<string, unknown>;
		if (step.type === 'call') {
			step.fn.apply(step.thisObj ?? target, step.params);
		} else if (step.type === 'set') {
			for (const key of Object.keys(step.props)) {
				target[key] = step.props[key];
			}
		}
	}

	/** Seek to an absolute time position (ms) across all steps. */
	private _seekTo(positionMs: number): void {
		let remaining = positionMs;
		this._stepIndex = 0;
		this._stepElapsed = 0;
		for (let i = 0; i < this._steps.length; i++) {
			const step = this._steps[i];
			if (step.duration === 0) continue;
			if (remaining <= step.duration) {
				this._stepIndex = i;
				this._stepElapsed = remaining;
				this._initStep(step);
				this._applyStep(step, remaining / step.duration);
				return;
			}
			remaining -= step.duration;
		}
		this._stepIndex = this._steps.length;
	}

	_recycle(): void {
		this._target = undefined;
		this._steps = [];
		this._stepIndex = 0;
		this._stepElapsed = 0;
		this._paused = false;
		this._onChange = undefined;
		this._onChangeObj = undefined;
		this._onLoopComplete = undefined;
		this._onLoopCompleteObj = undefined;
	}

	private _init(
		target: object,
		options?: TweenOptions & { onChange?: (tween: Tween) => void; onChangeObj?: object },
	): void {
		this._target = target;
		this._steps = [];
		this._stepIndex = 0;
		this._stepElapsed = 0;
		this._paused = false;
		this._loop = options?.loop ?? false;
		this._ignoreGlobalPause = options?.ignoreGlobalPause ?? false;
		this._defaultEase = options?.ease ?? Ease.linear;
		this._onChange = options?.onChange;
		this._onChangeObj = options?.onChangeObj;
		this._onLoopComplete = options?.onLoopComplete;
		this._onLoopCompleteObj = options?.onLoopCompleteObj;
	}
}
