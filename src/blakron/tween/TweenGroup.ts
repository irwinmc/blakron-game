import { Tween } from './Tween.js';
import type { TweenOptions } from './types.js';

/**
 * Manages a named collection of Tween instances.
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

	/**
	 * Returns the number of tracked tweens.
	 */
	public get size(): number {
		return this._tweens.length;
	}

	// ── Public methods ────────────────────────────────────────────────────────

	/**
	 * Creates and tracks a Tween.
	 */
	public get(target: object, options?: TweenOptions): Tween {
		const tween = Tween.get(target, options);
		this._track(tween);
		return tween;
	}

	/**
	 * Tracks an existing Tween.
	 */
	public add(tween: Tween): void {
		this._track(tween);
	}

	/**
	 * Pauses every tracked Tween.
	 */
	public pause(): void {
		for (const tween of this._tweens) {
			tween.pause();
		}
	}

	/**
	 * Resumes every tracked Tween.
	 */
	public resume(): void {
		for (const tween of this._tweens) {
			tween.resume();
		}
	}

	/**
	 * Removes every tracked Tween.
	 */
	public removeAll(): void {
		for (const tween of this._tweens.slice()) {
			tween.remove();
		}
		this._tweens = [];
	}

	// ── Private methods ───────────────────────────────────────────────────────

	private _track(tween: Tween): void {
		if (this._tweens.includes(tween)) {
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
