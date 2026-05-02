/**
 * Easing function signature.
 * @param t Normalized time [0, 1]
 * @returns Eased value
 */
export type EaseFunction = (t: number) => number;

/**
 * Options passed to Tween.get() or Tween constructor.
 */
export interface TweenOptions {
	/** Whether to loop the tween indefinitely */
	loop?: boolean;
	/** Whether to ignore global pause state */
	ignoreGlobalPause?: boolean;
	/** Override ease for the entire tween */
	ease?: EaseFunction;
}
