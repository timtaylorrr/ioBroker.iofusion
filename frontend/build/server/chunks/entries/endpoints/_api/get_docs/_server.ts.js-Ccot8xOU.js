import { j as json, e as error } from '../../../../chunks/exports.js-Bd3l1EgL.js';
import { g } from '../../../../chunks/marked.esm.js-CegTtKpz.js';
import { readdir, readFile } from 'fs/promises';
import '../../../../chunks/utils.js-D2UuUCQ3.js';

// src/routes/_api/get_docs/+server.ts
var GET = async ({ setHeaders }) => {
	try {
		const dir = "./build/client/documentation";
		const mdFiles = (await readdir(dir)).filter((file) => file.endsWith(".md"));
		const results = await Promise.all(mdFiles.map(async (file) => {
			const path = `${dir}/${file}`;
			const data = await readFile(path, "utf-8");
			const parsed = g.parse(data);
			return [file.replace(".md", ""), parsed];
		}));
		setHeaders({ "Cache-Control": "max-age=0" });
		return json(Object.fromEntries(results));
	} catch (err) {
		error(500, err.message);
	}
};

export { GET };
//# sourceMappingURL=_server.ts.js-Ccot8xOU.js.map
