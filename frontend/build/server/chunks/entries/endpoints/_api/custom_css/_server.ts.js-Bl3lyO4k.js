import { e as error, j as json } from '../../../../chunks/exports.js-Bd3l1EgL.js';
import { readFile, writeFile } from 'fs/promises';
import '../../../../chunks/utils.js-D2UuUCQ3.js';

// src/routes/_api/custom_css/+server.ts
/**
* Reads the contents of '/data/custom_css.css'.
* If the file doesn't exist, creates it with default content.
*/
var GET = async ({ setHeaders }) => {
	let file;
	const path = `${process.env.DATA_DIR || "./data"}/custom_css.css`;
	try {
		file = await readFile(path, "utf-8");
	} catch (err) {
		if (err.code === "ENOENT") {
			console.warn(`File not found... creating ${path}`);
			const content = `/* 🎨 Custom CSS file loaded! */\n/* Add your custom styles below */\n\n`;
			await writeFile(path, content, "utf-8");
			file = content;
		} else error(500, err.message);
	}
	setHeaders({ "Cache-Control": "max-age=0" });
	return json(file);
};
/**
* Writes content to '/data/custom_css.css'.
*/
var POST = async ({ request }) => {
	const body = await request.json();
	const path = `${process.env.DATA_DIR || "./data"}/custom_css.css`;
	if (typeof body.content !== "string") return new Response(JSON.stringify({ error: "Invalid content - must be a string" }), { status: 400 });
	try {
		await writeFile(path, body.content, "utf-8");
		return json({ action: "saved" });
	} catch (error) {
		return new Response(JSON.stringify({ error }), { status: 400 });
	}
};

export { GET, POST };
//# sourceMappingURL=_server.ts.js-Bl3lyO4k.js.map
