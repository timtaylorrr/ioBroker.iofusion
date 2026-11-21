import { e as error, j as json } from '../../../../chunks/exports.js-Bd3l1EgL.js';
import { readFile, writeFile } from 'fs/promises';
import '../../../../chunks/utils.js-D2UuUCQ3.js';

// src/routes/_api/custom_js/+server.ts
/**
* Reads the contents of '/data/custom_javascript.js'.
* If the file doesn't exist, creates it with default content.
*/
var GET = async ({ setHeaders }) => {
	let file;
	const path = `${process.env.DATA_DIR || "./data"}/custom_javascript.js`;
	try {
		file = await readFile(path, "utf-8");
	} catch (err) {
		if (err.code === "ENOENT") {
			console.warn(`File not found... creating ${path}`);
			const content = `console.debug('🎉 Custom JavaScript file loaded!');\n`;
			await writeFile(path, `console.debug('🎉 Custom JavaScript file loaded!');\n`, "utf-8");
			file = content;
		} else error(500, err.message);
	}
	setHeaders({ "Cache-Control": "max-age=0" });
	return json(file);
};

export { GET };
//# sourceMappingURL=_server.ts.js-gxbVmtns.js.map
