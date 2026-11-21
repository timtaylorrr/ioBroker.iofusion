import { j as json, e as error } from '../../../../chunks/exports.js-Bd3l1EgL.js';
import { readdir } from 'fs/promises';
import path from 'path';
import '../../../../chunks/utils.js-D2UuUCQ3.js';

// src/routes/_api/list_languages/+server.ts
var GET = async ({ setHeaders }) => {
	try {
		const languages = (await readdir("./build/client/translations")).filter((file) => path.extname(file) === ".json").map((file) => file.split(".")[0]);
		setHeaders({ "Cache-Control": "max-age=0" });
		return json(languages);
	} catch (err) {
		error(500, err.message);
	}
};

export { GET };
//# sourceMappingURL=_server.ts.js-CluU_1k0.js.map
