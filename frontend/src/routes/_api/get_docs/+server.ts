import { readdir, readFile } from 'fs/promises';
import { json, error } from '@sveltejs/kit';
import { marked } from 'marked';
import { clientDir } from '$lib/server/paths';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ setHeaders }) => {
	try {
		const dir = `${clientDir}/documentation`;
		const files = await readdir(dir);
		const mdFiles = files.filter((file) => file.endsWith('.md'));

		const results = await Promise.all(
			mdFiles.map(async (file) => {
				const path = `${dir}/${file}`;
				const data = await readFile(path, 'utf-8');
				const parsed = marked.parse(data);

				return [file.replace('.md', ''), parsed];
			})
		);

		setHeaders({ 'Cache-Control': 'max-age=0' });

		return json(Object.fromEntries(results));
	} catch (err) {
		error(500, (err as Error).message);
	}
};
