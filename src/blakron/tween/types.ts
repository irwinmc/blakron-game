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
}
