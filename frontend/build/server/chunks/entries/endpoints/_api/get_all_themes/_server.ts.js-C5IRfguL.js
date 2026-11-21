import { j as json, e as error } from '../../../../chunks/exports.js-Bd3l1EgL.js';
import { l as load } from '../../../../chunks/js-yaml.js-BMpLS0W5.js';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import '../../../../chunks/utils.js-D2UuUCQ3.js';

// src/routes/_api/get_all_themes/+server.ts
var GET = async ({ setHeaders }) => {
	try {
		const dir = "./build/client/themes";
		const yamlFiles = (await readdir(dir)).filter((file) => file.endsWith(".yaml"));
		const validate = (await Promise.all(yamlFiles.map(async (file) => {
			const filePath = `${dir}/${file}`;
			const data = await readFile(filePath, "utf-8");
			const themeData = load(data);
			if (path.parse(file).name !== themeData?.title) return null;
			return {
				file,
				title: themeData?.title,
				author: themeData?.author,
				attribution: themeData?.attribution,
				theme: themeData?.theme
			};
		}))).filter(Boolean);
		setHeaders({ "Cache-Control": "max-age=0" });
		return json(validate);
	} catch (err) {
		error(500, err.message);
	}
};

export { GET };
//# sourceMappingURL=_server.ts.js-C5IRfguL.js.map
