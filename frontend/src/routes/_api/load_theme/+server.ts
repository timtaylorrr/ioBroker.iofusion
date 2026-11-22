import { readFile } from 'fs/promises';
import { json, error } from '@sveltejs/kit';
import * as yaml from 'js-yaml';
import { clientDir } from '$lib/server/paths';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const file = await readFile(
			`${clientDir}/themes/${body?.theme}.yaml`,
			'utf8'
		);
		const content = yaml.load(file);

		return json(content);
	} catch (err: any) {
		error(500, err.message);
	}
};
