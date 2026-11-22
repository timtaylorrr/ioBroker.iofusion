'use strict';

const fs = require('node:fs');
const path = require('node:path');

/** Copy the default data files (dashboard, config, ...) on first start. */
function ensureDataDir(dataDir) {
	fs.mkdirSync(dataDir, { recursive: true });
	const defaults = path.join(__dirname, '..', 'frontend', 'data');
	if (!fs.existsSync(defaults)) return;
	for (const file of fs.readdirSync(defaults)) {
		const target = path.join(dataDir, file);
		if (!fs.existsSync(target)) fs.copyFileSync(path.join(defaults, file), target);
	}
}

/**
 * Access token for the WebSocket. Kept in the data directory so it survives restarts;
 * a page that was open during a restart keeps working after it reconnects.
 */
function loadToken(dataDir) {
	const file = path.join(dataDir, '.ws-token');
	try {
		const existing = fs.readFileSync(file, 'utf8').trim();
		if (existing.length >= 32) return existing;
	} catch {
		/* created below */
	}
	const token = require('node:crypto').randomBytes(24).toString('hex');
	fs.writeFileSync(file, token, { mode: 0o600 });
	return token;
}

module.exports = { ensureDataDir, loadToken };
