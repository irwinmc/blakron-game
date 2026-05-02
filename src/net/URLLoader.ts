import {
	EventDispatcher,
	Event,
	IOErrorEvent,
	ProgressEvent,
	HttpRequest,
	HttpResponseType,
	ImageLoader,
	Texture,
	Sound,
} from '@blakron/core';
import type { URLRequest } from './URLRequest.js';
import { URLLoaderDataFormat } from './URLLoaderDataFormat.js';

/**
 * High-level resource loader, Egret-compatible.
 *
 * Delegates to the appropriate core loader based on `dataFormat`,
 * then populates `data` and dispatches `Event.COMPLETE`.
 *
 * @example
 * ```ts
 * const loader = new URLLoader();
 * loader.dataFormat = URLLoaderDataFormat.JSON;
 * loader.addEventListener(Event.COMPLETE, () => console.log(loader.data));
 * loader.addEventListener(IOErrorEvent.IO_ERROR, () => console.error('failed'));
 * loader.load(new URLRequest('data/config.json'));
 * ```
 */
export class URLLoader extends EventDispatcher {
	// ── Instance fields ───────────────────────────────────────────────────────

	public dataFormat: URLLoaderDataFormat = URLLoaderDataFormat.TEXT;
	public data: unknown;

	private _xhr?: HttpRequest;
	private _imageLoader?: ImageLoader;
	private _sound?: Sound;

	// ── Constructor ───────────────────────────────────────────────────────────

	/**
	 * @param request Optional URLRequest to load immediately on construction.
	 */
	public constructor(request?: URLRequest) {
		super();
		if (request) {
			this.load(request);
		}
	}

	// ── Public methods ────────────────────────────────────────────────────────

	public load(request: URLRequest): void {
		this.close();

		switch (this.dataFormat) {
			case URLLoaderDataFormat.TEXTURE:
				this._loadTexture(request);
				break;
			case URLLoaderDataFormat.SOUND:
				this._loadSound(request);
				break;
			default:
				this._loadXhr(request);
				break;
		}
	}

	public close(): void {
		if (this._xhr) {
			this._xhr.abort();
			this._xhr = undefined;
		}
		if (this._imageLoader) {
			this._imageLoader.removeEventListener(Event.COMPLETE, this._handleImageComplete);
			this._imageLoader.removeEventListener(IOErrorEvent.IO_ERROR, this._handleError);
			this._imageLoader = undefined;
		}
		if (this._sound) {
			this._sound.removeEventListener(Event.COMPLETE, this._handleSoundComplete);
			this._sound.removeEventListener(IOErrorEvent.IO_ERROR, this._handleError);
			this._sound.close();
			this._sound = undefined;
		}
	}

	// ── Private methods ───────────────────────────────────────────────────────

	private _loadXhr(request: URLRequest): void {
		const xhr = new HttpRequest();
		this._xhr = xhr;

		xhr.responseType = this._toHttpResponseType();

		xhr.addEventListener(Event.COMPLETE, this._handleXhrComplete);
		xhr.addEventListener(IOErrorEvent.IO_ERROR, this._handleError);
		xhr.addEventListener(ProgressEvent.PROGRESS, this._handleProgress);

		xhr.open(request.url, request.method as Parameters<HttpRequest['open']>[1]);

		for (const header of request.requestHeaders) {
			xhr.setRequestHeader(header.name, header.value);
		}

		xhr.send(request.data ?? undefined);
	}

	private _loadTexture(request: URLRequest): void {
		const loader = new ImageLoader();
		this._imageLoader = loader;

		loader.addEventListener(Event.COMPLETE, this._handleImageComplete);
		loader.addEventListener(IOErrorEvent.IO_ERROR, this._handleError);

		loader.load(request.url);
	}

	private _loadSound(request: URLRequest): void {
		const sound = new Sound();
		this._sound = sound;

		sound.addEventListener(Event.COMPLETE, this._handleSoundComplete);
		sound.addEventListener(IOErrorEvent.IO_ERROR, this._handleError);

		sound.load(request.url);
	}

	private _handleXhrComplete = (_e: Event): void => {
		const response = this._xhr?.response;

		switch (this.dataFormat) {
			case URLLoaderDataFormat.JSON:
				try {
					this.data = JSON.parse(response as string);
				} catch {
					this._dispatchError();
					return;
				}
				break;
			case URLLoaderDataFormat.BINARY:
				this.data = response as ArrayBuffer;
				break;
			default:
				this.data = response as string;
				break;
		}

		this.dispatchEventWith(Event.COMPLETE);
	};

	private _handleImageComplete = (_e: Event): void => {
		const bitmapData = this._imageLoader?.data;
		if (!bitmapData) {
			this._dispatchError();
			return;
		}
		const texture = new Texture();
		texture.setBitmapData(bitmapData);
		this.data = texture;
		this.dispatchEventWith(Event.COMPLETE);
	};

	private _handleSoundComplete = (_e: Event): void => {
		this.data = this._sound;
		this.dispatchEventWith(Event.COMPLETE);
	};

	private _handleError = (_e: Event): void => {
		this._dispatchError();
	};

	private _handleProgress = (e: Event): void => {
		const pe = e as ProgressEvent;
		ProgressEvent.dispatchProgressEvent(this, ProgressEvent.PROGRESS, pe.bytesLoaded, pe.bytesTotal);
	};

	private _dispatchError(): void {
		IOErrorEvent.dispatchIOErrorEvent(this);
	}

	private _toHttpResponseType(): HttpResponseType {
		switch (this.dataFormat) {
			case URLLoaderDataFormat.BINARY:
				return HttpResponseType.ARRAY_BUFFER;
			default:
				return HttpResponseType.TEXT;
		}
	}
}
