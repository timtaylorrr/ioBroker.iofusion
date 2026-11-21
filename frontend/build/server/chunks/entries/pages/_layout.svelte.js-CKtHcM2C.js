import { _ as head } from '../../chunks/server2.js-3CCBNf-F.js';
import '../../chunks/Stores.js-D1c7UQ4J.js';
import { L as LegacyModals } from '../../chunks/Modals.js-BY7D36NX.js';
import { L as Loader } from '../../chunks/Loader.js-D2JBK0Dv.js';
import 'node:module';

// src/routes/+layout.svelte
function _layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children } = $$props;
		head("12qhfyh", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>FUSION</title>`);
			});
			$$renderer.push(`<meta name="description" content="fusion"/> <meta charset="utf-8"/>`);
		});
		LegacyModals($$renderer, { $$slots: {
			backdrop: ($$renderer) => {
				$$renderer.push(`<div slot="backdrop" class="backdrop svelte-12qhfyh" role="button" tabindex="0"></div>`);
			},
			loading: ($$renderer) => {
				$$renderer.push(`<div slot="loading">`);
				Loader($$renderer);
				$$renderer.push(`<!----></div>`);
			}
		} });
		$$renderer.push(`<!----> `);
		children($$renderer);
		$$renderer.push(`<!---->`);
	});
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte.js-CKtHcM2C.js.map
