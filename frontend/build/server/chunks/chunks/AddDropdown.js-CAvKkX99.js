import { $ as escape_html, a1 as store_get, a4 as unsubscribe_stores } from './server2.js-3CCBNf-F.js';
import { o as lang } from './Stores.js-Ds1UPH-g.js';
import { I as Icon } from './Icon.js-WGuGVXqb.js';
import 'node:module';
import './index-server2.js-dcuzgjTu.js';
import './rolldown-runtime.js-DkXggAHL.js';

// src/lib/Drawer/AddDropdown.svelte
function AddDropdown($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { view } = $$props;
		$$renderer.push(`<div class="container svelte-1tj3lob"><button class="button"><figure>`);
		Icon($$renderer, {
			icon: "gridicons:add-outline",
			height: "none"
		});
		$$renderer.push(`<!----></figure> <span>${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("add"))}</span></button> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { AddDropdown as default };
//# sourceMappingURL=AddDropdown.js-CAvKkX99.js.map
