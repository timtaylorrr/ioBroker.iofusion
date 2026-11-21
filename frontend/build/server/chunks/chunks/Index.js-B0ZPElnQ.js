import { a9 as attr_class, a1 as store_get, Y as await_block, a4 as unsubscribe_stores, N as derived } from './server2.js-3CCBNf-F.js';
import { j as editMode, C as history, D as historyIndex } from './Stores.js-Ds1UPH-g.js';
import 'node:module';
import './Icon.js-WGuGVXqb.js';
import './index-server2.js-dcuzgjTu.js';
import './rolldown-runtime.js-DkXggAHL.js';

// src/lib/Drawer/Separator.svelte
function Separator($$renderer) {
	$$renderer.push(`<hr class="svelte-kl1ok6"/>`);
}
// src/lib/Drawer/Index.svelte
function Index($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { data, view, toggleDrawer } = $$props;
		/**
		* Determines whether the dashboard data has been modified,
		* property is passed to both `EditModeButton` and `SaveButton`
		*/
		let modified = derived(() => store_get($$store_subs ??= {}, "$history", history)?.[store_get($$store_subs ??= {}, "$historyIndex", historyIndex)] !== store_get($$store_subs ??= {}, "$history", history)?.[0]);
		$$renderer.push(`<header id="drawer" class="svelte-1f6evc1"><div${attr_class("svelte-1f6evc1", void 0, {
			"grid": !store_get($$store_subs ??= {}, "$editMode", editMode),
			"grid-editmode": store_get($$store_subs ??= {}, "$editMode", editMode)
		})}><div class="edit svelte-1f6evc1">`);
		await_block($$renderer, import('./EditModeButton.js-Cy1tzEfl.js'), () => {}, (EditModeButton) => {
			if (EditModeButton.default) {
				$$renderer.push("<!--[-->");
				EditModeButton.default($$renderer, {
					modified: modified(),
					toggleDrawer
				});
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		});
		$$renderer.push(`<!--]--></div> `);
		if (store_get($$store_subs ??= {}, "$editMode", editMode)) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="add svelte-1f6evc1">`);
			await_block($$renderer, import('./AddDropdown.js-CAvKkX99.js'), () => {}, (AddDropdown) => {
				if (AddDropdown.default) {
					$$renderer.push("<!--[-->");
					AddDropdown.default($$renderer, { view });
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]--></div> <div class="appearance svelte-1f6evc1">`);
			await_block($$renderer, import('./AppearanceButton.js-C_-EsICS.js'), () => {}, (AppearanceButton) => {
				if (AppearanceButton.default) {
					$$renderer.push("<!--[-->");
					AppearanceButton.default($$renderer, {});
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]--></div> <div class="history svelte-1f6evc1">`);
			await_block($$renderer, import('./HistoryButtons.js-W2m991aG.js'), () => {}, (HistoryButtons) => {
				if (HistoryButtons.default) {
					$$renderer.push("<!--[-->");
					HistoryButtons.default($$renderer, {});
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]--></div> <div class="save push svelte-1f6evc1">`);
			await_block($$renderer, import('./SaveButton.js-DLrgOxWk.js'), () => {}, (SaveButton) => {
				if (SaveButton.default) {
					$$renderer.push("<!--[-->");
					SaveButton.default($$renderer, { modified: modified() });
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]--></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="code svelte-1f6evc1">`);
			await_block($$renderer, import('./CodeButton.js-CesPtr9I.js'), () => {}, (CodeButton) => {
				if (CodeButton.default) {
					$$renderer.push("<!--[-->");
					CodeButton.default($$renderer, {});
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]--></div> `);
			Separator($$renderer);
			$$renderer.push(`<!----> <div class="search svelte-1f6evc1">`);
			await_block($$renderer, import('./SearchInput.js-Jx2W6ODE.js'), () => {}, (SearchInput) => {
				if (SearchInput.default) {
					$$renderer.push("<!--[-->");
					SearchInput.default($$renderer, {});
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]--></div> <div class="settings push svelte-1f6evc1">`);
			await_block($$renderer, import('./SettingsButton.js-BOmO7ncE.js'), () => {}, (SettingsButton) => {
				if (SettingsButton.default) {
					$$renderer.push("<!--[-->");
					SettingsButton.default($$renderer, { data });
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div></header>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { Index as default };
//# sourceMappingURL=Index.js-B0ZPElnQ.js.map
