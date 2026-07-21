import type { Texture } from '@blakron/core';

/**
 * A single frame in a MovieClip animation.
 */
export interface MovieClipFrame {
	texture?: Texture;
	/** Timing metadata in milliseconds for an external animation scheduler. */
	duration: number;
	label?: string;
	/** Custom event name dispatched when this frame becomes current. */
	event?: string;
}

/**
 * A named, inclusive frame range. Frame indices are 0-based.
 */
export interface MovieClipLabel {
	name: string;
	startFrame: number;
	endFrame: number;
}

/**
 * A texture region in an Egret MovieClip data set's `res` map.
 */
export interface EgretMovieClipResourceData {
	x: number;
	y: number;
	w: number;
	h: number;
}

/**
 * A key frame in an Egret MovieClip data set.
 */
export interface EgretMovieClipFrameData {
	res?: string;
	x?: number;
	y?: number;
	/** Number of logical animation frames this key frame occupies. */
	duration?: number;
}

/**
 * A label entry in an Egret MovieClip data set. Frame numbers are 1-based.
 */
export interface EgretMovieClipLabelData {
	name: string;
	frame: number;
	end?: number;
}

/**
 * A frame event entry in an Egret MovieClip data set. Frame numbers are 1-based.
 */
export interface EgretMovieClipEventData {
	frame: number;
	name: string;
}

/**
 * Data for one named MovieClip in an Egret MovieClip data set.
 */
export interface EgretMovieClipData {
	frameRate?: number;
	frames?: EgretMovieClipFrameData[];
	labels?: EgretMovieClipLabelData[];
	events?: EgretMovieClipEventData[];
}

/**
 * The JSON structure emitted by Egret's MovieClip exporter.
 */
export interface EgretMovieClipDataSet {
	mc?: Record<string, EgretMovieClipData>;
	res?: Record<string, EgretMovieClipResourceData>;
}

/**
 * Events dispatched by MovieClip.
 */
export const MovieClipEvent = {
	COMPLETE: 'complete',
	LOOP_COMPLETE: 'loopComplete',
	FRAME_CHANGE: 'frameChange',
} as const;

export type MovieClipEventType = (typeof MovieClipEvent)[keyof typeof MovieClipEvent];
