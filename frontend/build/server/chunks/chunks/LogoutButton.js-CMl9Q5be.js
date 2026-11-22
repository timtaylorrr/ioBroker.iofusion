import { $ as escape_html, a1 as store_get, a4 as unsubscribe_stores } from './server2.js-3CCBNf-F.js';
import { o as lang } from './Stores.js-Ds1UPH-g.js';
import { I as Icon } from './Icon.js-WGuGVXqb.js';
import './routing.js-DHi-aafC.js';
import './server.js-DiHwXqKh.js';
import './internal2.js-D46zyVA4.js';
import './index-server2.js-dcuzgjTu.js';
import './rolldown-runtime.js-DkXggAHL.js';
import 'node:module';
import './events.js-B96EXmHB.js';

// src/lib/Drawer/LogoutButton.svelte
function LogoutButton($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		$$renderer.push(`<button class="button"><figure>`);
		Icon($$renderer, {
			icon: "mdi:logout",
			height: "none"
		});
		$$renderer.push(`<!----></figure> <span class="svelte-1h34rs3">${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("logout"))}</span></button>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { LogoutButton as default };
//# sourceMappingURL=LogoutButton.js-CMl9Q5be.js.map
