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

module.exports = { ensureDataDir };
