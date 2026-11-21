import './Stores.js-D1c7UQ4J.js';
import { o as onDestroy } from './index-server2.js-dcuzgjTu.js';
import './server2.js-3CCBNf-F.js';
import './rolldown-runtime.js-DkXggAHL.js';
import 'node:module';

// src/lib/Sidebar/Toast.svelte
function Toast($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let timeout;
		onDestroy(() => clearTimeout(timeout));
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}

export { Toast as default };
//# sourceMappingURL=Toast.js-BFLkqLdt.js.map
