import { j as json, e as error } from '../../../../chunks/exports.js-Bd3l1EgL.js';
import { l as load } from '../../../../chunks/js-yaml.js-BMpLS0W5.js';
import { c as clientDir } from '../../../../chunks/paths.js-CaWsJ0JW.js';
import { readFile } from 'fs/promises';
import '../../../../chunks/utils.js-D2UuUCQ3.js';

// src/routes/_api/load_theme/+server.ts
var POST = async ({ request }) => {
	try {
		const body = await request.json();
		const file = await readFile(`${clientDir}/themes/${body?.theme}.yaml`, "utf8");
		const content = load(file);
		return json(content);
	} catch (err) {
		error(500, err.message);
	}
};

export { POST };
//# sourceMappingURL=_server.ts.js-CghqFPNR.js.map
