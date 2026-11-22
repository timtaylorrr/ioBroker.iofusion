'use strict';

const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

/**
 * Serves the built SvelteKit app and the Home Assistant compatible
 * WebSocket (/api/websocket) on one port.
 *
 * @param {{port: number, bind: string, dataDir: string, token: string, bridge: import('./bridge').Bridge, log?: object}} options
 */
async function startServer({ port, bind, dataDir, token, bridge, auth, log = console }) {
	// the SvelteKit handler reads these at import time / per request
	process.env.DATA_DIR = dataDir;
	process.env.IOFUSION_TOKEN = token;
	process.env.BODY_SIZE_LIMIT = process.env.BODY_SIZE_LIMIT || '10M';
	process.env.CLIENT_DIR = path.join(__dirname, '..', 'frontend', 'build', 'client');
	process.env.IOFUSION_AUTH = auth?.enabled ? '1' : '0';
	delete process.env.HASS_URL; // origin of the request is used instead

	const handlerPath = path.join(__dirname, '..', 'frontend', 'build', 'handler.js');
	const { handler } = await import(pathToFileURL(handlerPath).href);

	const server = http.createServer((req, res) => {
		// login page, logout and the gate in front of everything else
		if (auth?.handle(req, res)) return;
		handler(req, res, () => {
			res.statusCode = 404;
			res.end('Not found');
		});
	});

	server.on('upgrade', (req, socket, head) => {
		const reject = (status) => {
			log.warn?.(`ioFusion: WebSocket refused (${status}) for origin ${req.headers.origin || '-'}, host ${req.headers.host}`);
			socket.write(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`);
			socket.destroy();
		};
		if (auth?.enabled) {
			if (!auth.isAuthed(req)) return reject('401 Unauthorized');
			// refuse cross-site WebSocket connections
			const origin = req.headers.origin;
			if (origin && new URL(origin).host !== req.headers.host) return reject('403 Forbidden');
		}
		if (new URL(req.url, 'http://localhost').pathname === '/api/websocket') {
			bridge.handleUpgrade(req, socket, head);
		} else {
			socket.destroy();
		}
	});

	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(port, bind, resolve);
	});
	log.info?.(`ioFusion listening on http://${bind}:${port}`);
	return server;
}

module.exports = { startServer };
