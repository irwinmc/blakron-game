import type { EaseFunction } from './types.js';

/**
 * Collection of easing functions compatible with Egret's Ease API.
 *
 * All functions take a normalized time t ∈ [0, 1] and return an eased value.
 *
 * @example
 * ```ts
 * Tween.get(obj).to({ x: 100 }, 500, Ease.cubicOut);
 * ```
 */
export const Ease = {
	// ── Linear ──────────────────────────────────────────────────────────
	/** No easing */
	linear: (t: number): number => t,

	// ── Sine ────────────────────────────────────────────────────────────
	sineIn: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),
	sineOut: (t: number): number => Math.sin((t * Math.PI) / 2),
	sineInOut: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,

	// ── Quad ────────────────────────────────────────────────────────────
	quadIn: (t: number): number => t * t,
	quadOut: (t: number): number => t * (2 - t),
	quadInOut: (t: number): number => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

	// ── Cubic ───────────────────────────────────────────────────────────
	cubicIn: (t: number): number => t * t * t,
	cubicOut: (t: number): number => --t * t * t + 1,
	cubicInOut: (t: number): number => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),

	// ── Quart ───────────────────────────────────────────────────────────
	quartIn: (t: number): number => t * t * t * t,
	quartOut: (t: number): number => 1 - --t * t * t * t,
	quartInOut: (t: number): number => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),

	// ── Quint ───────────────────────────────────────────────────────────
	quintIn: (t: number): number => t * t * t * t * t,
	quintOut: (t: number): number => 1 + --t * t * t * t * t,
	quintInOut: (t: number): number => (t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t),

	// ── Expo ────────────────────────────────────────────────────────────
	expoIn: (t: number): number => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
	expoOut: (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
	expoInOut: (t: number): number => {
		if (t === 0) return 0;
		if (t === 1) return 1;
		return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
	},

	// ── Circ ────────────────────────────────────────────────────────────
	circIn: (t: number): number => 1 - Math.sqrt(1 - t * t),
	circOut: (t: number): number => Math.sqrt(1 - --t * t),
	circInOut: (t: number): number =>
		t < 0.5 ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2,

	// ── Back ────────────────────────────────────────────────────────────
	backIn: (t: number): number => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return c3 * t * t * t - c1 * t * t;
	},
	backOut: (t: number): number => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
	},
	backInOut: (t: number): number => {
		const c1 = 1.70158;
		const c2 = c1 * 1.525;
		return t < 0.5
			? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
			: (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
	},

	// ── Elastic ─────────────────────────────────────────────────────────
	elasticIn: (t: number): number => {
		if (t === 0) return 0;
		if (t === 1) return 1;
		return -Math.pow(2, 10 * t - 10) * Math.sin(((t * 10 - 10.75) * (2 * Math.PI)) / 3);
	},
	elasticOut: (t: number): number => {
		if (t === 0) return 0;
		if (t === 1) return 1;
		return Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1;
	},
	elasticInOut: (t: number): number => {
		if (t === 0) return 0;
		if (t === 1) return 1;
		return t < 0.5
			? -(Math.pow(2, 20 * t - 10) * Math.sin(((20 * t - 11.125) * (2 * Math.PI)) / 4.5)) / 2
			: (Math.pow(2, -20 * t + 10) * Math.sin(((20 * t - 11.125) * (2 * Math.PI)) / 4.5)) / 2 + 1;
	},

	// ── Bounce ──────────────────────────────────────────────────────────
	bounceOut: (t: number): number => {
		const n1 = 7.5625;
		const d1 = 2.75;
		if (t < 1 / d1) return n1 * t * t;
		if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
		if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
		return n1 * (t -= 2.625 / d1) * t + 0.984375;
	},
	bounceIn: (t: number): number => 1 - Ease.bounceOut(1 - t),
	bounceInOut: (t: number): number =>
		t < 0.5 ? (1 - Ease.bounceOut(1 - 2 * t)) / 2 : (1 + Ease.bounceOut(2 * t - 1)) / 2,

	/**
	 * Create a custom cubic bezier easing function.
	 * @param x1 Control point 1 x
	 * @param y1 Control point 1 y
	 * @param x2 Control point 2 x
	 * @param y2 Control point 2 y
	 */
	cubicBezier(x1: number, y1: number, x2: number, y2: number): EaseFunction {
		// Newton-Raphson approximation
		return (t: number): number => {
			let x = t;
			for (let i = 0; i < 8; i++) {
				const cx = 3 * x1 * x * (1 - x) * (1 - x) + 3 * x2 * x * x * (1 - x) + x * x * x - t;
				const dx = 3 * x1 * (1 - x) * (1 - x) + 6 * x2 * x * (1 - x) - 3 * x1 * x * (1 - x) * 2 + 3 * x * x;
				if (Math.abs(cx) < 1e-6) break;
				x -= cx / dx;
			}
			return 3 * y1 * x * (1 - x) * (1 - x) + 3 * y2 * x * x * (1 - x) + x * x * x;
		};
	},
} as const;
