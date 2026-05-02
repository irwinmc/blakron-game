// TODO: implement MovieClipData
// Holds the frame data for a MovieClip animation.
//
// Egret-compatible API:
//   const data = new MovieClipData();
//   data.addFrame(texture, duration, label?)
//   data.frameCount        → number
//   data.getFrame(index)   → MovieClipFrame
//   data.getFrameByLabel(label) → number (frame index)
//
// Factory helpers (Egret assetsmanager integration):
//   MovieClipData.fromSpriteSheet(sheet, config)
//   MovieClipData.fromTextureArray(textures, fps)

import type { MovieClipFrame } from './types.js';

export class MovieClipData {
	get frameCount(): number {
		// TODO
		throw new Error('MovieClipData not yet implemented');
	}

	addFrame(_texture: MovieClipFrame['texture'], _duration: number, _label?: string): void {
		// TODO
		throw new Error('MovieClipData#addFrame() not yet implemented');
	}

	getFrame(_index: number): MovieClipFrame {
		// TODO
		throw new Error('MovieClipData#getFrame() not yet implemented');
	}

	getFrameByLabel(_label: string): number {
		// TODO: return -1 if not found
		throw new Error('MovieClipData#getFrameByLabel() not yet implemented');
	}
}
