/**
 * Encapsulates a single HTTP request header as a name/value pair.
 * Used in `URLRequest.requestHeaders`.
 */
export class URLRequestHeader {
	public name: string;
	public value: string;

	public constructor(name: string, value: string) {
		this.name = name;
		this.value = value;
	}
}
