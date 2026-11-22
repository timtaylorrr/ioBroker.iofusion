import { j as json, e as error } from '../../../../chunks/exports.js-Bd3l1EgL.js';
import { c as clientDir } from '../../../../chunks/paths.js-CaWsJ0JW.js';
import { readdir } from 'fs/promises';
import path from 'path';
import '../../../../chunks/utils.js-D2UuUCQ3.js';

// src/routes/_api/list_languages/+server.ts
var GET = async ({ setHeaders }) => {
	try {
		const dir = `${clientDir}/translations`;
		const languages = (await readdir(dir)).filter((file) => path.extname(file) === ".json").map((file) => file.split(".")[0]);
		setHeaders({ "Cache-Control": "max-age=0" });
		return json(languages);
	} catch (err) {
		error(500, err.message);
	}
};

export { GET };
//# sourceMappingURL=_server.ts.js-B-8z5cx3.js.map
