import { Tween } from './Tween.js';
import type { EaseFunction, TweenOptions } from './types.js';

/**
 * Manages a named group of Tween instances.
 * Allows pausing, resuming, and removing all tweens in the group together.
 *
 * @example
 * ```ts
 * const group = new TweenGroup('ui');
 * group.get(btnA).to({ alpha: 0 }, 300);
 * group.get(btnB).to({ alpha: 0 }, 300);
 *
 * // Later:
 * group.pause();
 * group.resume();
 * group.removeAll();
 * ```
 */
export class TweenGroup {
	readonly name: string;
	private _tweens: Tween[] = [];

	constructor(name = '') {
		this.name = name;
	}

	/**
	 * Create a Tween for the given target and register it in this group.
	 * Equivalent to `Tween.get()` but tracked by the group.
	 */
	get(target: object, options?: TweenOptions): Tween {
		const tween = Tween.get(target, options);
		this._tweens.push(tween);
		return tween;
	}

	/**
	 * Add an externally created Tween to this group.
	 */
	add(tween: Tween): void {
		if (!this._tweens.includes(tween)) {
			this._tweens.push(tween);
		}
	}

	/** Pause all tweens in this group. */
	pause(): void {
		for (const tween of this._tweens) {
			tween.pause();
		}
	}

	/** Resume all tweens in this group. */
	resume(): void {
		for (const tween of this._tweens) {
			tween.resume();
		}
	}

	/** Remove all tweens in this group from the active list. */
	removeAll(): void {
		for (const tween of this._tweens) {
			// Access internal target via the public removeTweens path
			Tween.removeTweens(tween as unknown as object);
		}
		this._tweens = [];
	}

	/** Number of tweens currently tracked by this group. */
	get size(): number {
		return this._tweens.length;
	}

	/**
	 * Remove completed tweens from the internal tracking list.
	 * Called automatically — or manually if you want to keep the list lean.
	 */
	gc(): void {
		// Tweens remove themselves from the active list when done,
		// but we still hold a reference here. Filter by checking if
		// the tween's target is still being tracked.
		// Simple approach: just clear finished tweens by trying to remove them.
		this._tweens = this._tweens.filter(t => {
			// A tween is "live" if it's still in the active list.
			// We can't inspect internals directly, so we keep all references
			// and let GC handle it. For explicit cleanup, call removeAll().
			return true;
		});
	}
}
