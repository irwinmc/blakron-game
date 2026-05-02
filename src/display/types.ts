import type { Texture } from '@blakron/core';

export interface MovieClipFrame {
	texture?: Texture;
	duration: number;
	label?: string;
}

export interface MovieClipEvent {
	COMPLETE: 'complete';
	FRAME_CHANGE: 'frameChange';
}
