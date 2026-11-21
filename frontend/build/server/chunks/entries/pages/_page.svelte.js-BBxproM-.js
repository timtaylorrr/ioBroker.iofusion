import { b as base } from '../../chunks/internal.js-BfoZvnx0.js';
import { a0 as store_set, a1 as store_get, a2 as attr_style, a3 as stringify, Y as await_block, a4 as unsubscribe_stores, _ as head, a5 as html, a6 as attr, a7 as bind_props, N as derived } from '../../chunks/server2.js-3CCBNf-F.js';
import { c as configuration, d as dashboard, t as translation, s as selectedLanguage, a as customJs, y as youtubeAddon, b as currentViewId, m as motion, e as drawerSearch, f as filterDashboard, g as showDrawer, h as connection, i as disableMenuButton, j as editMode, k as clickOriginatedFromMenu } from '../../chunks/Stores.js-Ds1UPH-g.js';
import '../../chunks/Modals.js-BY7D36NX.js';
import { o as onDestroy } from '../../chunks/index-server2.js-dcuzgjTu.js';
import '../../chunks/routing.js-DHi-aafC.js';
import '../../chunks/server.js-DiHwXqKh.js';
import '../../chunks/internal2.js-KHoVCR_I.js';
import 'node:module';
import '../../chunks/rolldown-runtime.js-DkXggAHL.js';
import '../../chunks/events.js-B96EXmHB.js';

// src/lib/Components/Theme.svelte
function Theme($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { initial = void 0 } = $$props;
		let css = derived(() => {
			const result = Object.entries(initial?.theme || {}).map(([key, value]) => {
				if (typeof value === "string" && value.includes("/themes/")) value = value.replace("/", `${base}/`);
				return `--theme-${key}: ${value};`;
			}).join(" ");
			if (store_get($$store_subs ??= {}, "$dashboard", dashboard)?.theme && false);
			return result;
		});
		head("1ei9tod", $$renderer, ($$renderer) => {
			$$renderer.push(`${html(`<style>:root {${css()}}</style>`)} <meta name="theme-color"${attr("content", initial?.theme?.["app-color"])}/>`);
		});
		if ($$store_subs) unsubscribe_stores($$store_subs);
		bind_props($$props, { initial });
	});
}
// src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		/**
		* Data from server-side load
		* function +page.server.ts
		*/
		let { data } = $$props;
		let altKeyPressed = false;
		store_set(configuration, data?.configuration);
		store_set(dashboard, data?.dashboard);
		store_set(translation, data?.translations);
		store_set(selectedLanguage, data?.configuration?.locale || "en");
		store_set(customJs, data?.configuration?.custom_js);
		store_set(youtubeAddon, data?.configuration?.addons?.youtube);
		store_set(currentViewId, store_get($$store_subs ??= {}, "$dashboard", dashboard)?.views?.[0]?.id);
		const _motion = data?.configuration?.motion;
		store_set(motion, _motion === void 0 || _motion === true ? store_get($$store_subs ??= {}, "$motion", motion) : 0);
		/**
		* Computes the current view.
		*
		* filterDashboard is filtered from search input, else
		* find `$currentViewId` OR when dragging get `isDndShadowItem`
		*/
		let view = derived(() => store_get($$store_subs ??= {}, "$drawerSearch", drawerSearch) ? store_get($$store_subs ??= {}, "$filterDashboard", filterDashboard) : store_get($$store_subs ??= {}, "$dashboard", dashboard)?.views?.find((view) => view?.id === store_get($$store_subs ??= {}, "$currentViewId", currentViewId)) || store_get($$store_subs ??= {}, "$dashboard", dashboard)?.views?.find((view) => view?.isDndShadowItem));
		let retryInterval;
		onDestroy(() => clearInterval(retryInterval));
		/**
		* Toggles drawer visibility and resets
		* the `$clickOriginatedFromMenu` flag.
		*/
		function toggleDrawer() {
			store_set(showDrawer, !store_get($$store_subs ??= {}, "$showDrawer", showDrawer));
			store_set(clickOriginatedFromMenu, false);
		}
		/**
		* If in edit mode, toggle editMode by programmatically clicking `EditModeButton`
		* to trigger any potential confirm dialogs. Else toggle drawer normally.
		*/
		function handleClick() {
			if (store_get($$store_subs ??= {}, "$editMode", editMode)) {
				store_set(clickOriginatedFromMenu, true);
				document.querySelector("#editmode")?.click();
			} else toggleDrawer();
		}
		Theme($$renderer, { initial: data?.theme });
		$$renderer.push(`<!----> <div id="layout" class="svelte-1uha8ag"${attr_style("", {
			"grid-template-columns": `${stringify(store_get($$store_subs ??= {}, "$dashboard", dashboard)?.hide_sidebar || !store_get($$store_subs ??= {}, "$dashboard", dashboard)?.sidebar?.length ? "0" : store_get($$store_subs ??= {}, "$dashboard", dashboard)?.sidebarWidth || 350)}px auto`,
			"grid-template-rows": store_get($$store_subs ??= {}, "$showDrawer", showDrawer) ? "auto auto 1fr" : "0fr auto 1fr",
			transition: `grid-template-rows ${stringify(store_get($$store_subs ??= {}, "$motion", motion))}ms ease, grid-template-columns ${stringify(store_get($$store_subs ??= {}, "$motion", motion))}ms ease`
		})}>`);
		await_block($$renderer, import('../../chunks/Views.js-CDKo_tJ7.js'), () => {}, (Views) => {
			if (Views.default) {
				$$renderer.push("<!--[-->");
				Views.default($$renderer, { view: view() });
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		});
		$$renderer.push(`<!--]--> `);
		if (view()?.sections) {
			$$renderer.push("<!--[0-->");
			await_block($$renderer, import('../../chunks/Index2.js-DxGqxkde.js'), () => {}, (Main) => {
				if (Main.default) {
					$$renderer.push("<!--[-->");
					Main.default($$renderer, {
						view: view(),
						altKeyPressed
					});
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]-->`);
		} else if (store_get($$store_subs ??= {}, "$connection", connection)) {
			$$renderer.push("<!--[1-->");
			await_block($$renderer, import('../../chunks/Intro.js-BeFkfcY9.js'), () => {}, (Intro) => {
				if (Intro.default) {
					$$renderer.push("<!--[-->");
					Intro.default($$renderer, { data });
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		await_block($$renderer, import('../../chunks/Index3.js-B4GfY0oG.js'), () => {}, (Sidebar) => {
			if (Sidebar.default) {
				$$renderer.push("<!--[-->");
				Sidebar.default($$renderer, { altKeyPressed });
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		});
		$$renderer.push(`<!--]--> `);
		if (!store_get($$store_subs ??= {}, "$disableMenuButton", disableMenuButton)) {
			$$renderer.push("<!--[0-->");
			await_block($$renderer, import('../../chunks/MenuButton.js-CQhlqVpl.js'), () => {}, (MenuButton) => {
				if (MenuButton.default) {
					$$renderer.push("<!--[-->");
					MenuButton.default($$renderer, { handleClick });
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (store_get($$store_subs ??= {}, "$showDrawer", showDrawer)) {
			$$renderer.push("<!--[0-->");
			await_block($$renderer, import('../../chunks/Index.js-B0ZPElnQ.js'), () => {}, (Drawer) => {
				if (Drawer.default) {
					$$renderer.push("<!--[-->");
					Drawer.default($$renderer, {
						view: view(),
						data,
						toggleDrawer
					});
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (store_get($$store_subs ??= {}, "$customJs", customJs)) {
			$$renderer.push("<!--[0-->");
			await_block($$renderer, import('../../chunks/CustomJs.js-BAvgTPtE.js'), () => {}, (CustomJs) => {
				if (CustomJs.default) {
					$$renderer.push("<!--[-->");
					CustomJs.default($$renderer, {});
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			});
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		await_block($$renderer, import('../../chunks/CustomCss.js-CEVZTymU.js'), () => {}, (CustomCss) => {
			if (CustomCss.default) {
				$$renderer.push("<!--[-->");
				CustomCss.default($$renderer, {});
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		});
		$$renderer.push(`<!--]--></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-BBxproM-.js.map
