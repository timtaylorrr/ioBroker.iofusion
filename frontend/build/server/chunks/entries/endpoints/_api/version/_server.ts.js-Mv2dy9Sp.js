import { j as json, e as error } from '../../../../chunks/exports.js-Bd3l1EgL.js';
import { readFile, writeFile } from 'fs/promises';
import '../../../../chunks/utils.js-D2UuUCQ3.js';

// src/routes/_api/version/+server.ts
var GET = async () => {
	try {
		const [packageFile, versionFile] = await Promise.all([readFile("./package.json", "utf8").catch(() => "{}"), readFile(`${process.env.DATA_DIR || "./data"}/version.json`, "utf8").catch(() => "{}")]);
		const packageData = JSON.parse(packageFile);
		const versionData = JSON.parse(versionFile);
		return json({
			installed: packageData?.version,
			latest: versionData?.latest,
			last_updated: versionData?.last_updated
		});
	} catch (err) {
		error(500, err);
	}
};
var POST = async ({ request }) => {
	try {
		const body = await request.json();
		const data = JSON.stringify(body, null, "	") + "\n";
		await writeFile(`${process.env.DATA_DIR || "./data"}/version.json`, data);
		return json({ message: "success" });
	} catch (err) {
		return error(500, err);
	}
};

export { GET, POST };
//# sourceMappingURL=_server.ts.js-Mv2dy9Sp.js.map
