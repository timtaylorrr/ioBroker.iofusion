import { readFile } from 'fs/promises';
import { dev } from '$app/environment';
import * as yaml from 'js-yaml';
import type { Configuration, Dashboard, Translations } from '$lib/Types';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Loads a yaml/json file and returns parsed data
 */
async function loadFile(file: string) {
	try {
		const data = await readFile(file, 'utf8');
		if (!data.trim()) {
			return {}; // file is empty, early return object
		} else {
			return file.endsWith('.yaml') ? yaml.load(data) : JSON.parse(data);
		}
	} catch (error) {
		if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
			// console.error(`No existing file found for ${file}`);
		} else {
			console.error(`Error reading or parsing ${file}:`, error);
		}
		return {};
	}
}

/**
 * Server load function
 */
export async function load({ request }): Promise<{
	configuration: Configuration;
	dashboard: Dashboard;
	theme: any;
	translations: Translations;
}> {
	// must be loaded first
	const [configuration, dashboard] = await Promise.all([
		loadFile(`${process.env.DATA_DIR || './data'}/configuration.yaml`),
		loadFile(`${process.env.DATA_DIR || './data'}/dashboard.yaml`)
	]);

	// hassUrl from env or server.js
	// ioFusion: without a configured target the page talks to its own origin.
	// adapter-node assumes https when ORIGIN is unset, so derive it from headers
	const host = request.headers.get('host');
	const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() || 'http';
	configuration.hassUrl =
		process.env.HASS_URL ||
		request.headers.get('X-Proxy-Target') ||
		(host ? `${proto}://${host}` : new URL(request.url).origin);

	// ioFusion adapter: access token for the built-in bridge
	if (process.env.IOFUSION_TOKEN) configuration.token = process.env.IOFUSION_TOKEN;
	if (process.env.IOFUSION_AUTH === '1') configuration.iofusionAuth = true;

	// initialize keys if missing
	dashboard.views = dashboard.views || [];
	dashboard.sidebar = dashboard.sidebar || [];

	const dir = dev ? './static' : process.env.CLIENT_DIR || './build/client';

	// load theme and locale
	const [theme, en, locale] = await Promise.all([
		loadFile(`${dir}/themes/${dashboard.theme || 'iofusion'}.yaml`),
		loadFile(`${dir}/translations/en.json`),
		configuration?.locale && configuration.locale !== 'en'
			? loadFile(`${dir}/translations/${configuration.locale}.json`)
			: undefined
	]);

	return {
		configuration,
		dashboard,
		theme,
		translations: locale ? { ...locale, _default: en } : en
	};
}
