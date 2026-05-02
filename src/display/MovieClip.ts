// TODO: implement MovieClip
// Sequence-frame animation display object, Egret-compatible.
//
// Egret-compatible API:
//   const mc = new MovieClip(data);
//   mc.play()
//   mc.stop()
//   mc.gotoAndPlay(frameIndexOrLabel)
//   mc.gotoAndStop(frameIndexOrLabel)
//   mc.currentFrame   → number (0-based)
//   mc.totalFrames    → number
//   mc.isPlaying      → boolean
//   mc.loop           → boolean
//
// Events dispatched:
//   Event.COMPLETE    — one full loop finished
//   'frameChange'     — frame index changed
//
// Implementation notes:
//   - Extends Bitmap (swap texture each frame)
//   - Driven by SystemTicker ENTER_FRAME
//   - Accumulates elapsed ms, advances frame when >= frame.duration
//   - gotoAndPlay/gotoAndStop accept both numeric index and string label

import { Bitmap } from '@blakron/core';
import type { MovieClipData } from './MovieClipData.js';

export class MovieClip extends Bitmap {
	constructor(_data?: MovieClipData) {
		super();
		// TODO: store data, register ticker listener
		throw new Error('MovieClip not yet implemented');
	}

	play(): void {
		// TODO
		throw new Error('MovieClip#play() not yet implemented');
	}

	stop(): void {
		// TODO
		throw new Error('MovieClip#stop() not yet implemented');
	}

	gotoAndPlay(_frameIndexOrLabel: number | string): void {
		// TODO
		throw new Error('MovieClip#gotoAndPlay() not yet implemented');
	}

	gotoAndStop(_frameIndexOrLabel: number | string): void {
		// TODO
		throw new Error('MovieClip#gotoAndStop() not yet implemented');
	}

	get currentFrame(): number {
		// TODO
		throw new Error('MovieClip#currentFrame not yet implemented');
	}

	get totalFrames(): number {
		// TODO
		throw new Error('MovieClip#totalFrames not yet implemented');
	}

	get isPlaying(): boolean {
		// TODO
		throw new Error('MovieClip#isPlaying not yet implemented');
	}
}
