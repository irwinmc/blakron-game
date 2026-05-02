// TODO: implement Tween
// See docs/plan.md for full spec.
//
// Egret-compatible API:
//   Tween.get(target, opts?)           → Tween instance
//   tween.to(props, duration, ease?)   → this  (animate to target values)
//   tween.from(props, duration, ease?) → this  (animate from values)
//   tween.wait(duration)               → this  (pause between steps)
//   tween.call(fn, thisObj?, args?)    → this  (callback step)
//   tween.set(props)                   → this  (instant property set)
//   tween.pause() / tween.resume()
//   Tween.pauseAll() / Tween.resumeAll()
//   Tween.removeTweens(target)
//
// Implementation notes:
//   - Each Tween holds a queue of TweenStep objects (to/from/wait/call/set)
//   - SystemTicker drives all active tweens via Tween._tick(dt)
//   - TweenGroup manages a named set of tweens (pause/resume/remove by group)
//   - loop option replays the step queue from the beginning on completion
//   - ignoreGlobalPause skips the global pause flag

import type { TweenOptions, EaseFunction } from './types.js';

export class Tween {
	// ── Static API ───────────────────────────────────────────────────────

	/**
	 * Create a new Tween for the given target object.
	 * @param target The object whose properties will be animated
	 * @param options Optional tween configuration
	 */
	static get(_target: object, _options?: TweenOptions): Tween {
		// TODO: return a pooled Tween instance registered with the ticker
		throw new Error('Tween.get() not yet implemented');
	}

	/**
	 * Remove all tweens targeting the given object.
	 */
	static removeTweens(_target: object): void {
		// TODO: remove from active tween list
		throw new Error('Tween.removeTweens() not yet implemented');
	}

	/**
	 * Pause all active tweens.
	 */
	static pauseAll(): void {
		// TODO
		throw new Error('Tween.pauseAll() not yet implemented');
	}

	/**
	 * Resume all paused tweens.
	 */
	static resumeAll(): void {
		// TODO
		throw new Error('Tween.resumeAll() not yet implemented');
	}

	// ── Instance API ─────────────────────────────────────────────────────

	/**
	 * Animate target properties to the given values over `duration` ms.
	 */
	to(_props: Record<string, number>, _duration: number, _ease?: EaseFunction): this {
		// TODO: push a ToStep onto the step queue
		throw new Error('Tween#to() not yet implemented');
	}

	/**
	 * Animate target properties from the given values to their current values.
	 */
	from(_props: Record<string, number>, _duration: number, _ease?: EaseFunction): this {
		// TODO: push a FromStep onto the step queue
		throw new Error('Tween#from() not yet implemented');
	}

	/**
	 * Wait (do nothing) for `duration` ms before proceeding to the next step.
	 */
	wait(_duration: number): this {
		// TODO: push a WaitStep onto the step queue
		throw new Error('Tween#wait() not yet implemented');
	}

	/**
	 * Call a function as a step in the tween sequence.
	 */
	call(_fn: () => void): this {
		// TODO: push a CallStep onto the step queue
		throw new Error('Tween#call() not yet implemented');
	}

	/**
	 * Instantly set properties on the target as a step.
	 */
	set(_props: Record<string, unknown>): this {
		// TODO: push a SetStep onto the step queue
		throw new Error('Tween#set() not yet implemented');
	}

	/** Pause this tween. */
	pause(): void {
		// TODO
		throw new Error('Tween#pause() not yet implemented');
	}

	/** Resume this tween. */
	resume(): void {
		// TODO
		throw new Error('Tween#resume() not yet implemented');
	}
}
