/**
 * Easing function signature — takes normalized time t ∈ [0, 1] and returns an eased value.
 */
export type EaseFunction = (t: number) => number;

/**
 * Options passed to `Tween.get()`.
 */
export interface TweenOptions {
	loop?: boolean;
	ignoreGlobalPause?: boolean;
	ease?: EaseFunction;
	/** Egret-compatible: start the tween in paused state. */
	paused?: boolean;
	/** Egret-compatible: jump to this time position (ms) immediately after creation. */
	position?: number;
	/** Egret-compatible: callback fired on every tick while the tween is running. */
	onChange?: (tween: unknown) => void;
	/** Egret-compatible: `this` context for the onChange callback. */
	onChangeObj?: object;
	/** Callback fired each time a looping tween completes one cycle. */
	onLoopComplete?: (tween: unknown) => void;
	/** `this` context for the onLoopComplete callback. */
	onLoopCompleteObj?: object;
}
