import { a2 as attr_style, $ as escape_html, a1 as store_get, a4 as unsubscribe_stores } from './server2.js-3CCBNf-F.js';
import { o as lang } from './Stores.js-Ds1UPH-g.js';
import './routing.js-DHi-aafC.js';
import './server.js-DiHwXqKh.js';
import './internal2.js-Djy_37J5.js';
import './Modals.js-BY7D36NX.js';
import { I as Icon } from './Icon.js-WGuGVXqb.js';
import './events.js-B96EXmHB.js';
import 'node:module';
import './index-server2.js-dcuzgjTu.js';
import './rolldown-runtime.js-DkXggAHL.js';

// src/lib/Drawer/AppearanceButton.svelte
function AppearanceButton($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		$$renderer.push(`<button class="button"><figure${attr_style("", { "margin-right": "0.1rem" })}>`);
		Icon($$renderer, {
			icon: "material-symbols:invert-colors-rounded",
			height: "none"
		});
		$$renderer.push(`<!----></figure> <span>${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("appearance"))}</span></button>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { AppearanceButton as default };
//# sourceMappingURL=AppearanceButton.js-CoRfn3Un.js.map
