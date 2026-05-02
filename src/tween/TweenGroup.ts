import { Tween } from './Tween.js';
import type { TweenOptions } from './types.js';

/**
 * Manages a named group of Tween instances.
 * Allows pausing, resuming, and removing all tweens in the group together.
 *
 * @example
 * ```ts
 * const group = new TweenGroup('ui');
 * group.get(btnA).to({ alpha: 0 }, 300);
 * group.get(btnB).to({ alpha: 0 }, 300);
 * group.pause();
 * group.resume();
 * group.removeAll();
 * ```
 */
export class TweenGroup {
	// ── Instance fields ───────────────────────────────────────────────────────

	public readonly name: string;
	private _tweens: Tween[] = [];

	// ── Constructor ───────────────────────────────────────────────────────────

	public constructor(name = '') {
		this.name = name;
	}

	// ── Getters / Setters ─────────────────────────────────────────────────────

	public get size(): number {
		return this._tweens.length;
	}

	// ── Public methods ────────────────────────────────────────────────────────

	/**
	 * Create a Tween for the given target and register it in this group.
	 */
	public get(target: object, options?: TweenOptions): Tween {
		const tween = Tween.get(target, options);
		this._tweens.push(tween);
		return tween;
	}

	/**
	 * Add an externally created Tween to this group.
	 */
	public add(tween: Tween): void {
		if (!this._tweens.includes(tween)) {
			this._tweens.push(tween);
		}
	}

	/**
	 * Pause all tweens in this group.
	 */
	public pause(): void {
		for (const tween of this._tweens) {
			tween.pause();
		}
	}

	/**
	 * Resume all tweens in this group.
	 */
	public resume(): void {
		for (const tween of this._tweens) {
			tween.resume();
		}
	}

	/**
	 * Remove all tweens in this group from the active list.
	 */
	public removeAll(): void {
		for (const tween of this._tweens) {
			Tween.removeTweens(tween as unknown as object);
		}
		this._tweens = [];
	}
}
