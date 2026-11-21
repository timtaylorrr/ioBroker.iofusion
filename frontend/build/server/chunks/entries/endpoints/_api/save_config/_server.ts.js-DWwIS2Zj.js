import { j as json } from '../../../../chunks/exports.js-Bd3l1EgL.js';
import { d as dump } from '../../../../chunks/js-yaml.js-BMpLS0W5.js';
import { writeFile } from 'fs/promises';
import '../../../../chunks/utils.js-D2UuUCQ3.js';

// src/routes/_api/save_config/+server.ts
var POST = async ({ request }) => {
	const body = await request.json();
	let data;
	try {
		data = dump(body);
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON - cannot convert to YAML" }), { status: 400 });
	}
	try {
		await writeFile(`${process.env.DATA_DIR || "./data"}/configuration.yaml`, data);
		return json({ action: "saved" });
	} catch (error) {
		return new Response(JSON.stringify({ error }), { status: 400 });
	}
};

export { POST };
//# sourceMappingURL=_server.ts.js-DWwIS2Zj.js.map
