import { a2 as attr_style, a3 as stringify, a1 as store_get, $ as escape_html, a4 as unsubscribe_stores } from './server2.js-3CCBNf-F.js';
import { m as motion, o as lang } from './Stores.js-Ds1UPH-g.js';
import './routing.js-DHi-aafC.js';
import './server.js-DiHwXqKh.js';
import './internal2.js-Djy_37J5.js';
import './Modals.js-BY7D36NX.js';
import { I as Icon } from './Icon.js-WGuGVXqb.js';
import './events.js-B96EXmHB.js';
import 'node:module';
import './index-server2.js-dcuzgjTu.js';
import './rolldown-runtime.js-DkXggAHL.js';

// src/lib/Drawer/SaveButton.svelte
function SaveButton($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { modified } = $$props;
		$$renderer.push(`<button class="button"${attr_style("", {
			opacity: modified ? "1" : "0.5",
			cursor: modified ? "pointer" : "unset",
			color: modified ? "#3b0f10" : "currentColor",
			"background-color": modified ? "#ffc107" : "var(--theme-drawer-button-background-color)",
			transition: `all ${stringify(store_get($$store_subs ??= {}, "$motion", motion))}ms ease`
		})}><figure>`);
		Icon($$renderer, {
			icon: "ic:round-save",
			height: "none"
		});
		$$renderer.push(`<!----></figure> ${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("save"))}</button>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { SaveButton as default };
//# sourceMappingURL=SaveButton.js-BF9GhgLN.js.map
