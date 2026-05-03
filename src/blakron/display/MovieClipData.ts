import type { Texture } from '@blakron/core';
import type { MovieClipFrame } from './types.js';

/**
 * Holds the frame data for a MovieClip animation.
 *
 * @example
 * ```ts
 * const data = new MovieClipData();
 * data.addFrame(tex1, 100, 'idle');
 * data.addFrame(tex2, 100);
 *
 * const data2 = MovieClipData.fromTextureArray([tex1, tex2, tex3], 12);
 * ```
 */
export class MovieClipData {
	// ── Instance fields ───────────────────────────────────────────────────────

	private _frames: MovieClipFrame[] = [];
	private _labelMap = new Map<string, number>();

	/**
	 * Frame rate in fps used when no per-clip override is set.
	 */
	public frameRate = 24;

	// ── Getters / Setters ─────────────────────────────────────────────────────

	/**
	 * Total number of frames.
	 */
	public get frameCount(): number {
		return this._frames.length;
	}

	/**
	 * Total animation duration in milliseconds.
	 */
	public get totalDuration(): number {
		let total = 0;
		for (const f of this._frames) {
			total += f.duration;
		}
		return total;
	}

	// ── Public methods ────────────────────────────────────────────────────────

	/**
	 * Append a frame to the animation.
	 * @param texture Texture to display (undefined = blank frame)
	 * @param duration Frame duration in milliseconds
	 * @param label Optional label for gotoAndPlay/gotoAndStop
	 */
	public addFrame(texture: Texture | undefined, duration: number, label?: string): void {
		const index = this._frames.length;
		this._frames.push({ texture, duration, label });
		if (label) {
			this._labelMap.set(label, index);
		}
	}

	/**
	 * Set a custom event name to dispatch when a specific frame is reached.
	 * @param frameIndex 0-based frame index
	 * @param eventName Event name to dispatch (e.g. 'attack', 'footstep')
	 */
	public setFrameEvent(frameIndex: number, eventName: string): void {
		const frame = this._frames[frameIndex];
		if (frame) frame.event = eventName;
	}

	/**
	 * Get a frame by 0-based internal index.
	 */
	public getFrame(index: number): MovieClipFrame | undefined {
		return this._frames[index];
	}

	/**
	 * Get the frame index for a given label.
	 * Returns -1 if the label is not found.
	 */
	public getFrameByLabel(label: string): number {
		return this._labelMap.get(label) ?? -1;
	}

	// ── Static factories ──────────────────────────────────────────────────────

	/**
	 * Create a MovieClipData from an array of textures at a fixed frame rate.
	 */
	public static fromTextureArray(textures: Texture[], fps = 12): MovieClipData {
		const data = new MovieClipData();
		const duration = 1000 / fps;
		for (const tex of textures) {
			data.addFrame(tex, duration);
		}
		return data;
	}

	/**
	 * Create a MovieClipData from a SpriteSheet using a list of frame names.
	 */
	public static fromSpriteSheet(
		sheet: { getTexture(name: string): Texture | undefined },
		frameNames: string[],
		fps = 12,
	): MovieClipData {
		const data = new MovieClipData();
		const duration = 1000 / fps;
		for (const name of frameNames) {
			data.addFrame(sheet.getTexture(name), duration, name);
		}
		return data;
	}
}
