import { $ as escape_html } from './server2.js-3CCBNf-F.js';
import { I as Icon } from './Icon.js-WGuGVXqb.js';
import { x as getName } from './Stores.js-Ds1UPH-g.js';
import { S as StateLogic } from './StateLogic.js-DQoyzIi2.js';
import './index-server2.js-dcuzgjTu.js';
import './rolldown-runtime.js-DkXggAHL.js';
import 'node:module';

// src/lib/Main/Camera/Info.svelte
function Info($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { sel, entity } = $$props;
		$$renderer.push(`<div class="container svelte-hg0aal"><div class="left svelte-hg0aal"><div class="icon svelte-hg0aal">`);
		Icon($$renderer, {
			icon: "mdi:camera",
			height: "auto",
			width: "100%"
		});
		$$renderer.push(`<!----></div></div> <div class="right svelte-hg0aal"><div class="name svelte-hg0aal">${escape_html(getName(void 0, entity))}</div> <div class="state svelte-hg0aal">`);
		StateLogic($$renderer, {
			entity_id: sel?.entity_id,
			selected: sel
		});
		$$renderer.push(`<!----></div></div></div>`);
	});
}

export { Info as default };
//# sourceMappingURL=Info.js-BAKjbkJU.js.map
