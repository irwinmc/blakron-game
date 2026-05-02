/**
 * Constants for URLLoader response data format.
 * Egret-compatible.
 */
export const URLLoaderDataFormat = {
	/** Response as plain text string */
	TEXT: 'text',
	/** Response as binary ArrayBuffer */
	BINARY: 'binary',
	/** Response parsed as JSON object */
	JSON: 'json',
	/** Response as a Texture (image) */
	TEXTURE: 'texture',
	/** Response as a Sound */
	SOUND: 'sound',
} as const;

export type URLLoaderDataFormat = (typeof URLLoaderDataFormat)[keyof typeof URLLoaderDataFormat];
