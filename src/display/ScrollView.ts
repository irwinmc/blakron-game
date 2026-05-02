import { Sprite, TouchEvent, Rectangle, Event } from '@blakron/core';

export const ScrollPolicy = {
	AUTO: 'auto',
	ON: 'on',
	OFF: 'off',
} as const;
export type ScrollPolicy = (typeof ScrollPolicy)[keyof typeof ScrollPolicy];

// ── Internal types ────────────────────────────────────────────────────────────

interface VelocitySample {
	dx: number;
	dy: number;
	dt: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SAMPLE_COUNT = 5;
const FRICTION = 0.95;
const SPRING = 0.2;
const STOP_THRESHOLD = 0.5;
const RESISTANCE = 0.4;
const FRAME_MS = 16.67;

/**
 * Inertial scrolling container, Egret-compatible.
 *
 * Wraps a content `Sprite` and provides touch-driven inertial scrolling
 * with bounce-back when the content is dragged past its bounds.
 *
 * @example
 * ```ts
 * const sv = new ScrollView();
 * sv.width = 640;
 * sv.height = 960;
 * sv.setContent(myContentSprite);
 * stage.addChild(sv);
 * ```
 */
export class ScrollView extends Sprite {
	// ── Instance fields ───────────────────────────────────────────────────────

	public horizontalScrollPolicy: ScrollPolicy = ScrollPolicy.AUTO;
	public verticalScrollPolicy: ScrollPolicy = ScrollPolicy.AUTO;

	private _content?: Sprite;
	private _scrollLeft = 0;
	private _scrollTop = 0;
	private _maxScrollLeft = 0;
	private _maxScrollTop = 0;

	// Touch tracking
	private _touchActive = false;
	private _touchId = -1;
	private _touchLastX = 0;
	private _touchLastY = 0;
	private _touchLastTime = 0;
	private _samples: VelocitySample[] = [];

	// Inertia
	private _velX = 0;
	private _velY = 0;
	private _inertiaActive = false;
	private _lastInertiaTime = 0;

	// ── Constructor ───────────────────────────────────────────────────────────

	public constructor() {
		super();
		this.touchEnabled = true;
		this.addEventListener(TouchEvent.TOUCH_BEGIN, this._handleTouchBegin);
	}

	// ── Getters / Setters ─────────────────────────────────────────────────────

	public get content(): Sprite | undefined {
		return this._content;
	}

	public get scrollLeft(): number {
		return this._scrollLeft;
	}

	public set scrollLeft(value: number) {
		this._setScroll(value, this._scrollTop);
	}

	public get scrollTop(): number {
		return this._scrollTop;
	}

	public set scrollTop(value: number) {
		this._setScroll(this._scrollLeft, value);
	}

	public get scrollRight(): number {
		return this._maxScrollLeft;
	}

	public get scrollBottom(): number {
		return this._maxScrollTop;
	}

	public override get width(): number {
		return super.width;
	}

	public override set width(value: number) {
		super.width = value;
		this._updateScrollRect();
		this._updateScrollBounds();
	}

	public override get height(): number {
		return super.height;
	}

	public override set height(value: number) {
		super.height = value;
		this._updateScrollRect();
		this._updateScrollBounds();
	}

	// ── Public methods ────────────────────────────────────────────────────────

	/**
	 * Set the scrollable content object.
	 */
	public setContent(content: Sprite): void {
		if (this._content) {
			this.removeChild(this._content);
		}
		this._content = content;
		this.addChild(content);
		this._updateScrollRect();
		this._updateScrollBounds();
	}

	// ── Override methods ──────────────────────────────────────────────────────

	public override onRemoveFromStage(): void {
		super.onRemoveFromStage();
		this._stopInertia();
		this._detachStageListeners();
	}

	// ── Private methods ───────────────────────────────────────────────────────

	private _handleTouchBegin = (e: Event): void => {
		const touch = e as TouchEvent;
		if (this._touchActive) return;
		this._touchActive = true;
		this._touchId = touch.touchPointID;
		this._touchLastX = touch.stageX;
		this._touchLastY = touch.stageY;
		this._touchLastTime = Date.now();
		this._samples = [];
		this._velX = 0;
		this._velY = 0;
		this._stopInertia();

		const stage = this.stage;
		if (!stage) return;
		stage.addEventListener(TouchEvent.TOUCH_MOVE, this._handleTouchMove);
		stage.addEventListener(TouchEvent.TOUCH_END, this._handleTouchEnd);
		stage.addEventListener(TouchEvent.TOUCH_CANCEL, this._handleTouchEnd);
	};

	private _handleTouchMove = (e: Event): void => {
		const touch = e as TouchEvent;
		if (!this._touchActive || touch.touchPointID !== this._touchId) return;

		const now = Date.now();
		const dt = now - this._touchLastTime || 1;
		const dx = touch.stageX - this._touchLastX;
		const dy = touch.stageY - this._touchLastY;

		this._touchLastX = touch.stageX;
		this._touchLastY = touch.stageY;
		this._touchLastTime = now;

		this._samples.push({ dx, dy, dt });
		if (this._samples.length > SAMPLE_COUNT) {
			this._samples.shift();
		}

		const newLeft = this._applyResistance(this._scrollLeft - dx, 0, this._maxScrollLeft);
		const newTop = this._applyResistance(this._scrollTop - dy, 0, this._maxScrollTop);
		this._setScroll(newLeft, newTop, true);
	};

	private _handleTouchEnd = (e: Event): void => {
		const touch = e as TouchEvent;
		if (!this._touchActive || touch.touchPointID !== this._touchId) return;
		this._touchActive = false;
		this._detachStageListeners();

		if (this._samples.length === 0) return;

		let totalWeight = 0;
		let vx = 0;
		let vy = 0;
		for (let i = 0; i < this._samples.length; i++) {
			const weight = i + 1;
			const s = this._samples[i];
			vx += (s.dx / s.dt) * weight;
			vy += (s.dy / s.dt) * weight;
			totalWeight += weight;
		}
		this._velX = -(vx / totalWeight);
		this._velY = -(vy / totalWeight);
		this._startInertia();
	};

	private _handleEnterFrame = (_e: Event): void => {
		const now = Date.now();
		const dt = now - this._lastInertiaTime;
		this._lastInertiaTime = now;

		const factor = Math.pow(FRICTION, dt / FRAME_MS);
		this._velX *= factor;
		this._velY *= factor;

		let newLeft = this._scrollLeft + this._velX * (dt / FRAME_MS);
		let newTop = this._scrollTop + this._velY * (dt / FRAME_MS);

		if (newLeft < 0) {
			newLeft += (0 - newLeft) * SPRING;
			this._velX *= 0.5;
		} else if (newLeft > this._maxScrollLeft) {
			newLeft += (this._maxScrollLeft - newLeft) * SPRING;
			this._velX *= 0.5;
		}

		if (newTop < 0) {
			newTop += (0 - newTop) * SPRING;
			this._velY *= 0.5;
		} else if (newTop > this._maxScrollTop) {
			newTop += (this._maxScrollTop - newTop) * SPRING;
			this._velY *= 0.5;
		}

		this._setScroll(newLeft, newTop, true);

		const inBoundsH = newLeft >= 0 && newLeft <= this._maxScrollLeft;
		const inBoundsV = newTop >= 0 && newTop <= this._maxScrollTop;
		if (Math.abs(this._velX) < STOP_THRESHOLD && Math.abs(this._velY) < STOP_THRESHOLD && inBoundsH && inBoundsV) {
			this._stopInertia();
		}
	};

	private _startInertia(): void {
		if (this._inertiaActive) return;
		this._inertiaActive = true;
		this._lastInertiaTime = Date.now();
		this.addEventListener(Event.ENTER_FRAME, this._handleEnterFrame);
	}

	private _stopInertia(): void {
		if (!this._inertiaActive) return;
		this._inertiaActive = false;
		this.removeEventListener(Event.ENTER_FRAME, this._handleEnterFrame);
	}

	private _setScroll(left: number, top: number, allowOverscroll = false): void {
		if (!allowOverscroll) {
			left = Math.max(0, Math.min(left, this._maxScrollLeft));
			top = Math.max(0, Math.min(top, this._maxScrollTop));
		}

		if (this.horizontalScrollPolicy !== ScrollPolicy.OFF) {
			this._scrollLeft = left;
		}
		if (this.verticalScrollPolicy !== ScrollPolicy.OFF) {
			this._scrollTop = top;
		}

		if (this._content) {
			this._content.x = -this._scrollLeft;
			this._content.y = -this._scrollTop;
		}
	}

	private _applyResistance(value: number, min: number, max: number): number {
		if (value < min) {
			return min + (value - min) * RESISTANCE;
		}
		if (value > max) {
			return max + (value - max) * RESISTANCE;
		}
		return value;
	}

	private _updateScrollRect(): void {
		this.scrollRect = new Rectangle(0, 0, this.width, this.height);
	}

	private _updateScrollBounds(): void {
		if (!this._content) {
			this._maxScrollLeft = 0;
			this._maxScrollTop = 0;
			return;
		}
		this._maxScrollLeft = Math.max(0, this._content.width - this.width);
		this._maxScrollTop = Math.max(0, this._content.height - this.height);
	}

	private _detachStageListeners(): void {
		const stage = this.stage;
		if (!stage) return;
		stage.removeEventListener(TouchEvent.TOUCH_MOVE, this._handleTouchMove);
		stage.removeEventListener(TouchEvent.TOUCH_END, this._handleTouchEnd);
		stage.removeEventListener(TouchEvent.TOUCH_CANCEL, this._handleTouchEnd);
	}
}
