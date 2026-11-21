// node_modules/.pnpm/@sveltejs+kit@2.69.2_@sveltejs+vite-plugin-svelte@7.2.0_svelte@5.56.8_@typescript-eslin_fe1b8803c1bddee9d0da6d0e9971d584/node_modules/@sveltejs/kit/src/runtime/server/constants.js
var NULL_BODY_STATUS = [
	101,
	103,
	204,
	205,
	304
];
var IN_WEBCONTAINER = !!globalThis.process?.versions?.webcontainer;
// node_modules/.pnpm/@sveltejs+kit@2.69.2_@sveltejs+vite-plugin-svelte@7.2.0_svelte@5.56.8_@typescript-eslin_fe1b8803c1bddee9d0da6d0e9971d584/node_modules/@sveltejs/kit/src/exports/internal/event.js
/** @import { RequestEvent } from '@sveltejs/kit' */
/** @import { RequestStore } from 'types' */
/** @import { AsyncLocalStorage } from 'node:async_hooks' */
/** @type {RequestStore | null} */
var sync_store = null;
/** @type {AsyncLocalStorage<RequestStore | null> | null} */
var als;
import('node:async_hooks').then((hooks) => als = new hooks.AsyncLocalStorage()).catch(() => {});
/**
* @template T
* @param {RequestStore | null} store
* @param {() => T} fn
*/
function with_request_store(store, fn) {
	try {
		sync_store = store;
		return als ? als.run(store, fn) : fn();
	} finally {
		if (!IN_WEBCONTAINER) sync_store = null;
	}
}
// node_modules/.pnpm/@sveltejs+kit@2.69.2_@sveltejs+vite-plugin-svelte@7.2.0_svelte@5.56.8_@typescript-eslin_fe1b8803c1bddee9d0da6d0e9971d584/node_modules/@sveltejs/kit/src/exports/internal/server.js
/**
* @template {{ tracing: { enabled: boolean, root: import('@opentelemetry/api').Span, current: import('@opentelemetry/api').Span } }} T
* @param {T} event_like
* @param {import('@opentelemetry/api').Span} current
* @returns {T}
*/
function merge_tracing(event_like, current) {
	return {
		...event_like,
		tracing: {
			...event_like.tracing,
			current
		}
	};
}

export { IN_WEBCONTAINER as I, NULL_BODY_STATUS as N, merge_tracing as m, with_request_store as w };
//# sourceMappingURL=server.js-DiHwXqKh.js.map
