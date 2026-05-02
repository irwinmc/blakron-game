import type { Texture } from '@blakron/core';

/**
 * A single frame in a MovieClip animation.
 */
export interface MovieClipFrame {
	/** Texture to display on this frame */
	texture: Texture | null;
	/** Duration of this frame in milliseconds */
	duration: number;
	/** Optional label for this frame (used with gotoAndPlay/gotoAndStop) */
	label?: string;
}

/**
 * Event type constants for MovieClip.
 */
export interface MovieClipEvent {
	/** Dispatched when the MovieClip completes one full loop */
	COMPLETE: 'complete';
	/** Dispatched on each frame change */
	FRAME_CHANGE: 'frameChange';
}
