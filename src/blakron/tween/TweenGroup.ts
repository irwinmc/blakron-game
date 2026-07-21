import { Tween } from './Tween.js';
import type { TweenOptions } from './types.js';

/**
 * Owns a named collection of active tweens for bulk lifecycle operations.
 * Members automatically unregister when they complete or are removed.
 */
export class TweenGroup {
	public readonly name: string;
	private _tweens: Tween[] = [];

	public constructor(name = '') {
		this.name = name;
	}

	/**
	 * Returns the number of currently active tweens in this group.
	 */
	public get size(): number {
		return this._tweens.length;
	}

	/**
	 * Creates a Tween and begins tracking its lifecycle.
	 */
	public get(target: object, options?: TweenOptions): Tween {
		const tween = Tween.get(target, options);
		this._track(tween);
		return tween;
	}

	/**
	 * Tracks an existing active Tween. Inactive tweens are ignored because they
	 * have no lifecycle left for this group to control.
	 */
	public add(tween: Tween): void {
		this._track(tween);
	}

	/**
	 * Pauses every currently tracked Tween.
	 */
	public pause(): void {
		for (const tween of this._tweens) {
			tween.pause();
		}
	}

	/**
	 * Resumes every currently tracked Tween.
	 */
	public resume(): void {
		for (const tween of this._tweens) {
			tween.resume();
		}
	}

	/**
	 * Removes every tracked Tween and clears the group.
	 */
	public removeAll(): void {
		for (const tween of this._tweens.slice()) {
			tween.remove();
		}
		this._tweens = [];
	}

	private _track(tween: Tween): void {
		if (!tween.isActive || this._tweens.includes(tween)) {
			return;
		}
		this._tweens.push(tween);
		tween._addReleaseListener(() => {
			const index = this._tweens.indexOf(tween);
			if (index !== -1) {
				this._tweens.splice(index, 1);
			}
		});
	}
}
