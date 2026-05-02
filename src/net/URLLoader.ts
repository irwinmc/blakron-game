// TODO: implement URLLoader
// High-level resource loader wrapping @blakron/core's HttpRequest and ImageLoader.
// Egret-compatible API.
//
// Egret-compatible API:
//   const loader = new URLLoader();
//   loader.dataFormat = URLLoaderDataFormat.JSON;
//   loader.addEventListener(Event.COMPLETE, onComplete);
//   loader.addEventListener(IOErrorEvent.IO_ERROR, onError);
//   loader.addEventListener(ProgressEvent.PROGRESS, onProgress);
//   loader.load(new URLRequest('data.json'));
//   loader.close();
//   loader.data  → loaded result (type depends on dataFormat)
//
// Implementation notes:
//   - TEXT / BINARY / JSON → delegate to HttpRequest
//   - TEXTURE              → delegate to ImageLoader → wrap as Texture
//   - SOUND                → delegate to Sound.load()
//   - Dispatch Event.COMPLETE with loader.data populated
//   - Dispatch IOErrorEvent.IO_ERROR on failure
//   - Dispatch ProgressEvent.PROGRESS during download (if available)

import { EventDispatcher } from '@blakron/core';
import type { URLRequest } from './URLRequest.js';
import type { URLLoaderDataFormat } from './URLLoaderDataFormat.js';

export class URLLoader extends EventDispatcher {
	/** Format of the loaded data (default: TEXT) */
	dataFormat: URLLoaderDataFormat = 'text';

	/** Loaded data — populated after Event.COMPLETE */
	data: unknown = null;

	load(_request: URLRequest): void {
		// TODO: branch on dataFormat, delegate to appropriate core loader
		throw new Error('URLLoader#load() not yet implemented');
	}

	close(): void {
		// TODO: abort in-flight request
		throw new Error('URLLoader#close() not yet implemented');
	}
}
