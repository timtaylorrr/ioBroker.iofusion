import { e as error, j as json } from '../../../../chunks/exports.js-Bd3l1EgL.js';
import { d as dump } from '../../../../chunks/js-yaml.js-BMpLS0W5.js';
import { writeFile } from 'fs/promises';
import '../../../../chunks/utils.js-D2UuUCQ3.js';

// src/routes/_api/save_dashboard/+server.ts
var POST = async ({ request }) => {
	const body = await request.json();
	let data;
	try {
		data = dump(body);
	} catch (err) {
		error(500, err.message);
	}
	try {
		await writeFile(`${process.env.DATA_DIR || "./data"}/dashboard.yaml`, data);
		return json({ message: "saved" });
	} catch (err) {
		error(500, err.message);
	}
};

export { POST };
//# sourceMappingURL=_server.ts.js-CkJkodde.js.map
