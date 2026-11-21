import { $ as escape_html, a1 as store_get, a4 as unsubscribe_stores } from './server2.js-3CCBNf-F.js';
import { o as lang } from './Stores.js-Ds1UPH-g.js';
import './Modals.js-BY7D36NX.js';
import { I as Icon } from './Icon.js-WGuGVXqb.js';
import './routing.js-DHi-aafC.js';
import './server.js-DiHwXqKh.js';
import './internal2.js-DRr0yVSZ.js';
import 'node:module';
import './index-server2.js-dcuzgjTu.js';
import './rolldown-runtime.js-DkXggAHL.js';
import './events.js-B96EXmHB.js';

// src/lib/Drawer/SettingsButton.svelte
function SettingsButton($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { data } = $$props;
		$$renderer.push(`<button class="button"><figure>`);
		Icon($$renderer, {
			icon: "clarity:settings-solid",
			height: "none"
		});
		$$renderer.push(`<!----></figure> <span>${escape_html(store_get($$store_subs ??= {}, "$lang", lang)("settings"))}</span></button>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { SettingsButton as default };
//# sourceMappingURL=SettingsButton.js-BlrQn_-3.js.map
