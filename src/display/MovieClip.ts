import { Bitmap, Event, ticker } from '@blakron/core';
import type { MovieClipData } from './MovieClipData.js';

/**
 * Sequence-frame animation display object, Egret-compatible.
 *
 * @example
 * ```ts
 * const data = MovieClipData.fromTextureArray([tex1, tex2, tex3], 12);
 * const mc = new MovieClip(data);
 * mc.loop = true;
 * mc.play();
 * stage.addChild(mc);
 * ```
 */
export class MovieClip extends Bitmap {
	// ── Instance fields ───────────────────────────────────────────────────────

	public loop = true;

	private _data?: MovieClipData;
	private _currentFrame = 0;
	private _isPlaying = false;
	private _elapsed = 0;
	private _lastTimeStamp = 0;

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

	// ── Public methods ────────────────────────────────────────────────────────

	public play(): void {
		if (this._isPlaying) return;
		if (!this._data || this._data.frameCount === 0) return;
		this._isPlaying = true;
		ticker.startTick(this._handleTick, this);
	}

	public stop(): void {
		if (!this._isPlaying) return;
		this._isPlaying = false;
		ticker.stopTick(this._handleTick, this);
	}

	/**
	 * Jump to a frame and start playing.
	 * @param frameIndexOrLabel 0-based frame index or a frame label string
	 */
	public gotoAndPlay(frameIndexOrLabel: number | string): void {
		this._gotoFrame(frameIndexOrLabel);
		this.play();
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

		this._elapsed += dt;

		while (true) {
			const frame = this._data.getFrame(this._currentFrame);
			if (!frame || this._elapsed < frame.duration) break;

			this._elapsed -= frame.duration;
			const nextFrame = this._currentFrame + 1;

			if (nextFrame >= this._data.frameCount) {
				this.dispatchEventWith(Event.COMPLETE);
				if (this.loop) {
					this._currentFrame = 0;
				} else {
					this._applyFrame(this._currentFrame);
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
