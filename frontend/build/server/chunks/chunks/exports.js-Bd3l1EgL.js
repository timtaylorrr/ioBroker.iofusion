import { t as text_encoder } from './utils.js-D2UuUCQ3.js';

// node_modules/.pnpm/@sveltejs+kit@2.69.2_@sveltejs+vite-plugin-svelte@7.2.0_svelte@5.56.8_@typescript-eslin_fe1b8803c1bddee9d0da6d0e9971d584/node_modules/@sveltejs/kit/src/exports/internal/index.js
/** @import { StandardSchemaV1 } from '@standard-schema/spec' */
var HttpError = class {
	/**
	* @param {number} status
	* @param {{message: string} extends App.Error ? (App.Error | string | undefined) : App.Error} body
	*/
	constructor(status, body) {
		this.status = status;
		if (typeof body === "string") this.body = { message: body };
		else if (body) this.body = body;
		else this.body = { message: `Error: ${status}` };
	}
	toString() {
		return JSON.stringify(this.body);
	}
};
var Redirect = class {
	/**
	* @param {300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308} status
	* @param {string} location
	*/
	constructor(status, location) {
		try {
			new Headers({ location });
		} catch {
			throw new Error(`Invalid redirect location ${JSON.stringify(location)}: this string contains characters that cannot be used in HTTP headers`);
		}
		this.status = status;
		this.location = location;
	}
};
/**
* An error that was thrown from within the SvelteKit runtime that is not fatal and doesn't result in a 500, such as a 404.
* `SvelteKitError` goes through `handleError`.
* @extends Error
*/
var SvelteKitError = class extends Error {
	/**
	* @param {number} status
	* @param {string} text
	* @param {string} message
	*/
	constructor(status, text, message) {
		super(message);
		this.status = status;
		this.text = text;
	}
};
/**
* @template [T=undefined]
*/
var ActionFailure = class {
	/**
	* @param {number} status
	* @param {T} data
	*/
	constructor(status, data) {
		this.status = status;
		this.data = data;
	}
};
// node_modules/.pnpm/@sveltejs+kit@2.69.2_@sveltejs+vite-plugin-svelte@7.2.0_svelte@5.56.8_@typescript-eslin_fe1b8803c1bddee9d0da6d0e9971d584/node_modules/@sveltejs/kit/src/exports/index.js
/** @import { StandardSchemaV1 } from '@standard-schema/spec' */
/**
* @template {number} TNumber
* @template {any[]} [TArray=[]]
* @typedef {TNumber extends TArray['length'] ? TArray[number] : LessThan<TNumber, [...TArray, TArray['length']]>} LessThan
*/
/**
* @template {number} TStart
* @template {number} TEnd
* @typedef {Exclude<TEnd | LessThan<TEnd>, LessThan<TStart>>} NumericRange
*/
/**
* Throws an error with a HTTP status code and an optional message.
* When called during request handling, this will cause SvelteKit to
* return an error response without invoking `handleError`.
* Make sure you're not catching the thrown error, which would prevent SvelteKit from handling it.
* @param {number} status The [HTTP status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#client_error_responses). Must be in the range 400-599.
* @param {App.Error} body An object that conforms to the App.Error type. If a string is passed, it will be used as the message property.
* @overload
* @param {number} status
* @param {App.Error} body
* @return {never}
* @throws {HttpError} This error instructs SvelteKit to initiate HTTP error handling.
* @throws {Error} If the provided status is invalid (not between 400 and 599).
*/
/**
* Throws an error with a HTTP status code and an optional message.
* When called during request handling, this will cause SvelteKit to
* return an error response without invoking `handleError`.
* Make sure you're not catching the thrown error, which would prevent SvelteKit from handling it.
* @param {number} status The [HTTP status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#client_error_responses). Must be in the range 400-599.
* @param {{ message: string } extends App.Error ? App.Error | string | undefined : never} [body] An object that conforms to the App.Error type. If a string is passed, it will be used as the message property.
* @overload
* @param {number} status
* @param {{ message: string } extends App.Error ? App.Error | string | undefined : never} [body]
* @return {never}
* @throws {HttpError} This error instructs SvelteKit to initiate HTTP error handling.
* @throws {Error} If the provided status is invalid (not between 400 and 599).
*/
/**
* Throws an error with a HTTP status code and an optional message.
* When called during request handling, this will cause SvelteKit to
* return an error response without invoking `handleError`.
* Make sure you're not catching the thrown error, which would prevent SvelteKit from handling it.
* @param {number} status The [HTTP status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#client_error_responses). Must be in the range 400-599.
* @param {{ message: string } extends App.Error ? App.Error | string | undefined : never} body An object that conforms to the App.Error type. If a string is passed, it will be used as the message property.
* @return {never}
* @throws {HttpError} This error instructs SvelteKit to initiate HTTP error handling.
* @throws {Error} If the provided status is invalid (not between 400 and 599).
*/
function error(status, body) {
	if (isNaN(status) || status < 400 || status > 599) throw new Error(`HTTP error status codes must be between 400 and 599 — ${status} is invalid`);
	throw new HttpError(status, body);
}
/**
* Checks whether this is a redirect thrown by {@link redirect}.
* @param {unknown} e The object to check.
* @return {e is Redirect}
*/
function isRedirect(e) {
	return e instanceof Redirect;
}
/**
* Create a JSON `Response` object from the supplied data.
* @param {any} data The value that will be serialized as JSON.
* @param {ResponseInit} [init] Options such as `status` and `headers` that will be added to the response. `Content-Type: application/json` and `Content-Length` headers will be added automatically.
*/
function json(data, init) {
	const body = JSON.stringify(data);
	const headers = new Headers(init?.headers);
	if (!headers.has("content-length")) headers.set("content-length", text_encoder.encode(body).byteLength.toString());
	if (!headers.has("content-type")) headers.set("content-type", "application/json");
	return new Response(body, {
		...init,
		headers
	});
}
/**
* Create a `Response` object from the supplied body.
* @param {string} body The value that will be used as-is.
* @param {ResponseInit} [init] Options such as `status` and `headers` that will be added to the response. A `Content-Length` header will be added automatically.
*/
function text(body, init) {
	const headers = new Headers(init?.headers);
	if (!headers.has("content-length")) {
		const encoded = text_encoder.encode(body);
		headers.set("content-length", encoded.byteLength.toString());
		return new Response(encoded, {
			...init,
			headers
		});
	}
	return new Response(body, {
		...init,
		headers
	});
}

export { ActionFailure as A, HttpError as H, Redirect as R, SvelteKitError as S, error as e, isRedirect as i, json as j, text as t };
//# sourceMappingURL=exports.js-Bd3l1EgL.js.map
