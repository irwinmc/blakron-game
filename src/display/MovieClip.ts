import { Bitmap, Event, ticker } from '@blakron/core';
import type { MovieClipData } from './MovieClipData.js';

/**
 * Sequence-frame animation display object, Egret-compatible.
 *
 * Frame numbers are 1-based, matching Egret's original API.
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
	private _currentFrameIndex = 0;
	private _isPlaying = false;
	private _elapsed = 0;
	private _lastTimeStamp = 0;
	private _playTimes = 1;
	private _playedTimes = 0;
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
		this._currentFrameIndex = 0;
		this._elapsed = 0;
		this._applyFrame(0);
	}

	/**
	 * Current frame number, 1-based (Egret-compatible).
	 */
	public get currentFrame(): number {
		return this._currentFrameIndex + 1;
	}

	/**
	 * Total number of frames.
	 */
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
		return this._data?.getFrame(this._currentFrameIndex)?.label;
	}

	/**
	 * Label of the current frame, or the nearest preceding labeled frame.
	 * Returns undefined if no labeled frame exists at or before the current frame.
	 */
	public get currentLabel(): string | undefined {
		if (!this._data) return undefined;
		for (let i = this._currentFrameIndex; i >= 0; i--) {
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

	/**
	 * Stop playback and stay on the current frame.
	 */
	public stop(): void {
		if (!this._isPlaying) return;
		this._isPlaying = false;
		ticker.stopTick(this._handleTick, this);
	}

	/**
	 * Move to the previous frame and stop.
	 */
	public prevFrame(): void {
		this.gotoAndStop(this.currentFrame - 1);
	}

	/**
	 * Move to the next frame and stop.
	 */
	public nextFrame(): void {
		this.gotoAndStop(this.currentFrame + 1);
	}

	/**
	 * Jump to a frame and start playing.
	 * @param frame 1-based frame number or a frame label string.
	 * @param playTimes Number of times to play (-1 = loop, 0 = keep current, >=1 = N times).
	 */
	public gotoAndPlay(frame: number | string, playTimes = 0): void {
		this._gotoFrame(frame);
		this.play(playTimes);
	}

	/**
	 * Jump to a frame and stop.
	 * @param frame 1-based frame number or a frame label string.
	 */
	public gotoAndStop(frame: number | string): void {
		this._gotoFrame(frame);
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

		const fps = !isNaN(this._frameRate) ? this._frameRate : (this._data.frameRate ?? 24);
		const frameDuration = 1000 / fps;

		this._elapsed += dt;

		while (this._elapsed >= frameDuration) {
			this._elapsed -= frameDuration;
			const nextIndex = this._currentFrameIndex + 1;

			if (nextIndex >= this._data.frameCount) {
				this._playedTimes++;
				const isInfinite = this._playTimes === -1;
				const hasMorePlays = isInfinite || this._playedTimes < this._playTimes;

				if (hasMorePlays) {
					this.dispatchEventWith(Event.LOOP_COMPLETE);
					this._currentFrameIndex = 0;
				} else {
					this._currentFrameIndex = this._data.frameCount - 1;
					this._applyFrame(this._currentFrameIndex);
					this.dispatchEventWith(Event.COMPLETE);
					this.stop();
					return;
				}
			} else {
				this._currentFrameIndex = nextIndex;
			}

			this._applyFrame(this._currentFrameIndex);
		}
	}

	private _gotoFrame(frame: number | string): void {
		if (!this._data) return;

		let index: number;
		if (typeof frame === 'string') {
			index = this._data.getFrameByLabel(frame);
			if (index === -1) return;
		} else {
			index = frame - 1;
		}

		this._currentFrameIndex = Math.max(0, Math.min(index, this._data.frameCount - 1));
		this._elapsed = 0;
		this._applyFrame(this._currentFrameIndex);
	}

	private _applyFrame(index: number): void {
		this.texture = this._data?.getFrame(index)?.texture;
	}
}
