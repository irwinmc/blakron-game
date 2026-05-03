import type { Texture } from '@blakron/core';

/**
 * A single frame in a MovieClip animation.
 */
export interface MovieClipFrame {
	texture?: Texture;
	duration: number;
	label?: string;
}

/**
 * Event type string constants dispatched by MovieClip.
 */
export interface MovieClipEvent {
	COMPLETE: 'complete';
	FRAME_CHANGE: 'frameChange';
}
