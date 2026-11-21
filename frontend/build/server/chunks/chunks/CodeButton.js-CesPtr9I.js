import { $ as escape_html, a1 as store_get, a4 as unsubscribe_stores } from './server2.js-3CCBNf-F.js';
import { o as lang } from './Stores.js-Ds1UPH-g.js';
import './Modals.js-BY7D36NX.js';
import { I as Icon } from './Icon.js-WGuGVXqb.js';
import 'node:module';
import './index-server2.js-dcuzgjTu.js';
import './rolldown-runtime.js-DkXggAHL.js';

// src/lib/Drawer/CodeButton.svelte
function CodeButton($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		$$renderer.push(`<button class="button"><figure>`);
		Icon($$renderer, {
			icon: "ph:code-bold",
			height: "none"
		});
		$$renderer.push(`<!----></figure> <span class="svelte-1lcp3iu">${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("code"))}</span></button>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { CodeButton as default };
//# sourceMappingURL=CodeButton.js-CesPtr9I.js.map
