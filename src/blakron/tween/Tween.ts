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

function _normalizeRepeat(repeat: number | undefined, loop: boolean | undefined): number {
	if (repeat === undefined) {
		return loop ? -1 : 0;
	}
	if (repeat === -1) {
		return -1;
	}
	if (!Number.isFinite(repeat)) {
		return 0;
	}
	return Math.max(0, Math.floor(repeat));
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

function _releaseTween(tween: Tween): void {
	const target = tween._target;
	if (!target) {
		return;
	}
	tween._target = undefined;
	_decTweenCount(target);
	_removeActive(tween);
	tween._notifyRelease();
	tween._resolveAll();
	tween._recycle();
	_pool.push(tween);
}

// ── Tween ─────────────────────────────────────────────────────────────────────

/**
 * Egret-compatible tween engine with repeat, yoyo, and thenable completion.
 */
export class Tween {
	// ── Static API ────────────────────────────────────────────────────────────

	/**
	 * Creates a Tween for a target.
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
		_addActive(tween);
		_incTweenCount(target);

		if (props?.position != null) {
			tween._seekTo(props.position);
		}

		return tween;
	}

	/**
	 * Returns the number of unreleased tweens targeting an object.
	 */
	public static getCount(target: object): number {
		return _getTweenCount(target);
	}

	/**
	 * Remove and recycle all tweens targeting the given object.
	 */
	public static removeTweens(target: object): void {
		if (_getTweenCount(target) === 0) return;
		for (let i = _activeTweens.length - 1; i >= 0; i--) {
			if (_activeTweens[i]._target === target) {
				_releaseTween(_activeTweens[i]);
			}
		}
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
		for (const tween of _activeTweens.slice()) {
			_releaseTween(tween);
		}
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
	private _generation = 0;
	private _paused = false;
	private _repeatsLeft = 0;
	private _yoyo = false;
	private _reversed = false;
	private _ignoreGlobalPause = false;
	private _defaultEase: EaseFunction = Ease.linear;
	private _onChange?: (tween: Tween) => void;
	private _onChangeObj?: object;
	private _onLoopComplete?: (tween: Tween) => void;
	private _onLoopCompleteObj?: object;
	private _resolvers: Array<() => void> = [];
	private _releaseListeners: Array<() => void> = [];
	private _isCompleted = false;

	// ── Instance API ──────────────────────────────────────────────────────────

	/**
	 * Resolves when the tween completes or is removed.
	 */
	public then<TResult1 = void, TResult2 = never>(
		onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | undefined | null,
		onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null,
	): PromiseLike<TResult1 | TResult2> {
		return new Promise<void>(resolve => {
			if (this._isCompleted) {
				resolve();
			} else {
				this._resolvers.push(resolve);
			}
		}).then(onfulfilled, onrejected);
	}

	public _addReleaseListener(listener: () => void): void {
		this._releaseListeners.push(listener);
	}

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
	 * Adds a delay to the sequence.
	 */
	public wait(duration: number, _passive?: boolean): this {
		if (duration <= 0) return this;
		this._steps.push({ type: 'wait', duration });
		return this;
	}

	/**
	 * Adds a callback step.
	 */
	public call(callback: (...args: unknown[]) => void, thisObj?: object, params?: unknown[]): this {
		this._steps.push({ type: 'call', duration: 0, fn: callback, thisObj, params: params ?? [] });
		return this;
	}

	/**
	 * Adds an immediate property update.
	 */
	public set(props: Record<string, unknown>): this {
		this._steps.push({ type: 'set', duration: 0, props });
		return this;
	}

	/**
	 * Pauses or resumes the tween.
	 */
	public setPaused(value: boolean): this {
		if (this._paused === value) return this;
		this._paused = value;
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
	 * Removes and recycles the tween.
	 */
	public remove(): void {
		_releaseTween(this);
	}

	/**
	 * Moves the sequence to an absolute position.
	 */
	public setPosition(value: number, _actionsMode = 1): void {
		this._seekTo(Math.max(0, value));
	}

	// ── Internal ──────────────────────────────────────────────────────────────

	public _tick(dt: number): void {
		if (this._paused) return;
		if (!this._ignoreGlobalPause && _globalPaused) return;
		if (!this._target) return;
		if (this._stepIndex >= this._steps.length) {
			_releaseTween(this);
			return;
		}

		const generation = this._generation;
		const hasTimedSteps = this._steps.some(step => step.duration > 0);
		let remaining = Math.max(0, dt);

		do {
			while (remaining > 0 && this._stepIndex < this._steps.length) {
				const step = this._steps[this._canonicalStepIndex(this._stepIndex)];

				if (step.duration === 0) {
					this._advanceInstantSteps();
					continue;
				}

				if (this._stepElapsed === 0) {
					this._initStep(step);
				}

				this._stepElapsed += remaining;
				if (this._stepElapsed >= step.duration) {
					remaining = this._stepElapsed - step.duration;
					this._stepElapsed = 0;
					this._applyStep(step, this._reversed ? 0 : 1);
					this._stepIndex++;
				} else {
					const t = this._stepElapsed / step.duration;
					this._applyStep(step, this._reversed ? 1 - t : t);
					remaining = 0;
				}
			}

			this._advanceInstantSteps();
			if (this._stepIndex < this._steps.length) {
				break;
			}

			if (this._repeatsLeft === 0) {
				if (this._onChange) {
					this._onChange.call(this._onChangeObj ?? this._target, this);
				}
				if (this._generation !== generation || !this._target) {
					return;
				}
				_releaseTween(this);
				return;
			}

			this._startNextCycle();
			if (this._generation !== generation || !this._target) {
				return;
			}
			if (!hasTimedSteps && this._repeatsLeft === -1) {
				break;
			}
		} while (remaining > 0 || (!hasTimedSteps && this._repeatsLeft !== -1));

		if (this._onChange) {
			this._onChange.call(this._onChangeObj ?? this._target, this);
		}
	}

	// ── Private ───────────────────────────────────────────────────────────────

	private _advanceInstantSteps(): void {
		while (
			this._stepIndex < this._steps.length &&
			this._steps[this._canonicalStepIndex(this._stepIndex)].duration === 0
		) {
			const step = this._steps[this._canonicalStepIndex(this._stepIndex)];
			if (step.type === 'to' || step.type === 'from') {
				this._initStep(step);
				this._applyStep(step, this._reversed ? 0 : 1);
			} else if (!this._reversed) {
				this._executeInstantStep(step);
			}
			this._stepIndex++;
		}
	}

	private _startNextCycle(): void {
		if (this._repeatsLeft > 0) {
			this._repeatsLeft--;
		}
		this._stepIndex = 0;
		this._stepElapsed = 0;
		if (this._yoyo) {
			this._reversed = !this._reversed;
		}
		if (this._onLoopComplete) {
			this._onLoopComplete.call(this._onLoopCompleteObj ?? this._target, this);
		}
	}

	private _initStep(step: TweenStep): void {
		if (step.type === 'to' && step.startValues) return;
		if (step.type === 'from' && step.endValues) return;

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

	private _canonicalStepIndex(i: number): number {
		return this._reversed ? this._steps.length - 1 - i : i;
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

	public _notifyRelease(): void {
		const listeners = this._releaseListeners;
		this._releaseListeners = [];
		for (const listener of listeners) {
			listener();
		}
	}

	_resolveAll(): void {
		this._isCompleted = true;
		if (this._resolvers.length === 0) return;
		const resolvers = this._resolvers;
		this._resolvers = [];
		for (const resolve of resolvers) resolve();
	}

	_recycle(): void {
		this._target = undefined;
		this._steps = [];
		this._stepIndex = 0;
		this._stepElapsed = 0;
		this._paused = false;
		this._repeatsLeft = 0;
		this._yoyo = false;
		this._reversed = false;
		this._onChange = undefined;
		this._onChangeObj = undefined;
		this._onLoopComplete = undefined;
		this._onLoopCompleteObj = undefined;
		this._resolvers = [];
		this._releaseListeners = [];
	}

	private _init(
		target: object,
		options?: TweenOptions & { onChange?: (tween: Tween) => void; onChangeObj?: object },
	): void {
		this._target = target;
		this._generation++;
		this._steps = [];
		this._stepIndex = 0;
		this._stepElapsed = 0;
		this._isCompleted = false;
		this._paused = options?.paused ?? false;
		this._repeatsLeft = _normalizeRepeat(options?.repeat, options?.loop);
		this._yoyo = options?.yoyo ?? false;
		this._reversed = false;
		this._ignoreGlobalPause = options?.ignoreGlobalPause ?? false;
		this._defaultEase = options?.ease ?? Ease.linear;
		this._onChange = options?.onChange;
		this._onChangeObj = options?.onChangeObj;
		this._onLoopComplete = options?.onLoopComplete;
		this._onLoopCompleteObj = options?.onLoopCompleteObj;
	}
}
