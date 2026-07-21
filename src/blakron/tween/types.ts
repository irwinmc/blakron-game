import type { Tween } from './Tween.js';

/**
 * Maps normalized progress to eased progress.
 */
export type EaseFunction = (t: number) => number;

/**
 * Configures a Tween created by `Tween.get()`.
 */
export interface TweenOptions {
	/**
	 * Repeats indefinitely when `repeat` is not set.
	 */
	loop?: boolean;
	/**
	 * Number of additional playback cycles; `-1` repeats indefinitely.
	 */
	repeat?: number;
	/**
	 * Alternates playback direction between cycles.
	 */
	yoyo?: boolean;
	/**
	 * Allows the tween to advance while all tweens are globally paused.
	 */
	ignoreGlobalPause?: boolean;
	/**
	 * Default easing function for property steps.
	 */
	ease?: EaseFunction;
	/**
	 * Starts the tween in a paused state.
	 */
	paused?: boolean;
	/**
	 * Initial sequence position in milliseconds.
	 */
	position?: number;
	/**
	 * Runs after each tween update.
	 */
	onChange?: (tween: Tween) => void;
	/**
	 * Provides the `this` value for `onChange`.
	 */
	onChangeObj?: object;
	/**
	 * Runs after each repeated cycle.
	 */
	onLoopComplete?: (tween: Tween) => void;
	/**
	 * Provides the `this` value for `onLoopComplete`.
	 */
	onLoopCompleteObj?: object;
}
