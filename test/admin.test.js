'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));

/** All user-visible strings of a jsonConfig (labels, help texts, confirm dialogs, options) */
function strings(node, out = new Set()) {
	if (Array.isArray(node)) node.forEach((n) => strings(n, out));
	else if (node && typeof node === 'object') {
		for (const [key, value] of Object.entries(node)) {
			if (['label', 'help', 'text', 'ok', 'cancel'].includes(key) && typeof value === 'string') out.add(value);
			else strings(value, out);
		}
	}
	return out;
}

test('every admin string is translated to German', () => {
	const de = read('admin/i18n/de/translations.json');
	const missing = [...strings(read('admin/jsonConfig.json'))].filter((s) => !(s in de));
	assert.deepStrictEqual(missing, []);
});

test('the admin config covers all native settings', () => {
	const native = Object.keys(read('io-package.json').native);
	const items = Object.keys(read('admin/jsonConfig.json').items);
	// generateDashboard is a button without a stored value
	assert.deepStrictEqual(native.filter((k) => !items.includes(k)), []);
});

test('package metadata is consistent', () => {
	const pkg = read('package.json');
	const io = read('io-package.json');
	assert.strictEqual(pkg.name, 'iobroker.iofusion');
	assert.strictEqual(pkg.version, io.common.version);
	assert.ok(io.common.news[io.common.version], 'news entry for the current version');
	assert.ok(fs.existsSync(path.join(__dirname, '..', 'admin', io.common.icon)), 'icon file exists');
	assert.ok(io.encryptedNative.includes('password'));
});
