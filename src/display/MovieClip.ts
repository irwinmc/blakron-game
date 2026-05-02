import { Bitmap, Event, ticker } from '@blakron/core';
import type { MovieClipData } from './MovieClipData.js';

/**
 * Sequence-frame animation display object, Egret-compatible.
 *
 * @example
 * ```ts
 * const data = MovieClipData.fromTextureArray([tex1, tex2, tex3], 12);
 * const mc = new MovieClip(data);
 * mc.play();
 * stage.addChild(mc);
 *
 * mc.addEventListener(Event.COMPLETE, () => console.log('done'));
 * mc.addEventListener(Event.LOOP_COMPLETE, () => console.log('loop'));
 * ```
 */
export class MovieClip extends Bitmap {
	// ── Instance fields ───────────────────────────────────────────────────────

	private _data?: MovieClipData;
	private _currentFrame = 0;
	private _isPlaying = false;
	private _elapsed = 0;
	private _lastTimeStamp = 0;
	/** -1 = infinite loop, 0 = use current setting, >=1 = play N times */
	private _playTimes = 1;
	private _playedTimes = 0;
	/** Per-clip frame rate override. NaN = use MovieClipData.frameRate */
	private _frameRate = NaN;

	// ── Constructor ───────────────────────────────────────────────────────────

	public constructor(data?: MovieClipData) {
		super();
		if (data) {
			this.movieClipData = data;
		}
	}

	// ── Getters / Setters ─────────────────────────────────────────────────────

	public get movieClipData(): MovieClipData | undefined {
		return this._data;
	}

	public set movieClipData(value: MovieClipData | undefined) {
		this._data = value;
		this._currentFrame = 0;
		this._elapsed = 0;
		this._applyFrame(0);
	}

	public get currentFrame(): number {
		return this._currentFrame;
	}

	public get totalFrames(): number {
		return this._data?.frameCount ?? 0;
	}

	public get isPlaying(): boolean {
		return this._isPlaying;
	}

	/**
	 * Label of the current frame, or undefined if the current frame has no label.
	 */
	public get currentFrameLabel(): string | undefined {
		return this._data?.getFrame(this._currentFrame)?.label;
	}

	/**
	 * Label of the current frame, or the nearest preceding labeled frame.
	 * Returns undefined if no labeled frame exists at or before the current frame.
	 */
	public get currentLabel(): string | undefined {
		if (!this._data) return undefined;
		for (let i = this._currentFrame; i >= 0; i--) {
			const label = this._data.getFrame(i)?.label;
			if (label) return label;
		}
		return undefined;
	}

	/**
	 * Per-clip frame rate in fps. When set, overrides the rate from MovieClipData.
	 * Set to NaN to restore the MovieClipData rate.
	 */
	public get frameRate(): number {
		if (!isNaN(this._frameRate)) return this._frameRate;
		return this._data?.frameRate ?? 24;
	}

	public set frameRate(value: number) {
		if (value === this._frameRate) return;
		this._frameRate = value;
	}

	// ── Public methods ────────────────────────────────────────────────────────

	/**
	 * Start or resume playback.
	 * @param playTimes Number of times to play. -1 = loop forever, 0 = keep current setting, >=1 = play N times.
	 */
	public play(playTimes = 0): void {
		this._lastTimeStamp = 0;
		if (playTimes !== 0) {
			this._playTimes = playTimes < 0 ? -1 : Math.floor(playTimes);
		}
		if (this._playTimes === 0) {
			this._playTimes = 1;
		}
		this._playedTimes = 0;
		if (this._isPlaying) return;
		if (!this._data || this._data.frameCount === 0) return;
		this._isPlaying = true;
		ticker.startTick(this._handleTick, this);
	}

	/** Stop playback and stay on the current frame. */
	public stop(): void {
		if (!this._isPlaying) return;
		this._isPlaying = false;
		ticker.stopTick(this._handleTick, this);
	}

	/** Move to the previous frame and stop. */
	public prevFrame(): void {
		this.gotoAndStop(Math.max(0, this._currentFrame - 1));
	}

	/** Move to the next frame and stop. */
	public nextFrame(): void {
		this.gotoAndStop(Math.min(this.totalFrames - 1, this._currentFrame + 1));
	}

	/**
	 * Jump to a frame and start playing.
	 * @param frameIndexOrLabel 0-based frame index or a frame label string
	 * @param playTimes Number of times to play (-1 = loop, 0 = keep current, >=1 = N times)
	 */
	public gotoAndPlay(frameIndexOrLabel: number | string, playTimes = 0): void {
		this._gotoFrame(frameIndexOrLabel);
		this.play(playTimes);
	}

	/**
	 * Jump to a frame and stop.
	 * @param frameIndexOrLabel 0-based frame index or a frame label string
	 */
	public gotoAndStop(frameIndexOrLabel: number | string): void {
		this._gotoFrame(frameIndexOrLabel);
		this.stop();
	}

	// ── Override methods ──────────────────────────────────────────────────────

	public override onRemoveFromStage(): void {
		super.onRemoveFromStage();
		this.stop();
	}

	// ── Private methods ───────────────────────────────────────────────────────

	private _handleTick = (timeStamp: number): boolean => {
		if (this._lastTimeStamp === 0) {
			this._lastTimeStamp = timeStamp;
			return false;
		}
		const dt = timeStamp - this._lastTimeStamp;
		this._lastTimeStamp = timeStamp;
		this._advance(dt);
		return false;
	};

	private _advance(dt: number): void {
		if (!this._data || this._data.frameCount === 0) return;

		// Use per-clip frameRate if set, otherwise fall back to MovieClipData rate
		const fps = !isNaN(this._frameRate) ? this._frameRate : (this._data.frameRate ?? 24);
		const frameDuration = 1000 / fps;

		this._elapsed += dt;

		while (this._elapsed >= frameDuration) {
			this._elapsed -= frameDuration;
			const nextFrame = this._currentFrame + 1;

			if (nextFrame >= this._data.frameCount) {
				this._playedTimes++;
				const isInfinite = this._playTimes === -1;
				const hasMorePlays = isInfinite || this._playedTimes < this._playTimes;

				if (hasMorePlays) {
					this.dispatchEventWith(Event.LOOP_COMPLETE);
					this._currentFrame = 0;
				} else {
					this._currentFrame = this._data.frameCount - 1;
					this._applyFrame(this._currentFrame);
					this.dispatchEventWith(Event.COMPLETE);
					this.stop();
					return;
				}
			} else {
				this._currentFrame = nextFrame;
			}

			this._applyFrame(this._currentFrame);
		}
	}

	private _gotoFrame(frameIndexOrLabel: number | string): void {
		if (!this._data) return;

		let index: number;
		if (typeof frameIndexOrLabel === 'string') {
			index = this._data.getFrameByLabel(frameIndexOrLabel);
			if (index === -1) return;
		} else {
			index = frameIndexOrLabel;
		}

		this._currentFrame = Math.max(0, Math.min(index, this._data.frameCount - 1));
		this._elapsed = 0;
		this._applyFrame(this._currentFrame);
	}

	private _applyFrame(index: number): void {
		this.texture = this._data?.getFrame(index)?.texture;
	}
}
