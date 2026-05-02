/**
 * Represents an HTTP request, Egret-compatible.
 *
 * @example
 * ```ts
 * const req = new URLRequest('https://example.com/data.json');
 * req.method = 'POST';
 * req.data = JSON.stringify({ key: 'value' });
 * ```
 */
export class URLRequest {
	/** Request URL */
	url: string;
	/** HTTP method (default: 'GET') */
	method: string = 'GET';
	/** Request body data */
	data: string | ArrayBuffer | null = null;
	/** Additional request headers */
	headers: Record<string, string> = {};

	constructor(url = '') {
		this.url = url;
	}
}
