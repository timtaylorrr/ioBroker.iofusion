'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { migrateTheme } = require('../lib/dashboard');
const { loadToken } = require('../lib/data');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'iofusion-'));

test('the old default theme is replaced once, with a backup', () => {
	const dir = tmp();
	fs.writeFileSync(path.join(dir, 'dashboard.yaml'), 'theme: godis\nviews:\n  - name: A\n    id: 1\n');
	assert.strictEqual(migrateTheme(dir), true);
	const text = fs.readFileSync(path.join(dir, 'dashboard.yaml'), 'utf8');
	assert.match(text, /theme: iofusion/);
	assert.match(text, /name: A/);
	assert.ok(fs.existsSync(path.join(dir, 'dashboard.yaml.bak-theme')));
	// a later manual choice of godis is respected
	fs.writeFileSync(path.join(dir, 'dashboard.yaml'), 'theme: godis\nviews: []\n');
	assert.strictEqual(migrateTheme(dir), false);
	assert.match(fs.readFileSync(path.join(dir, 'dashboard.yaml'), 'utf8'), /theme: godis/);
});

test('a dashboard without a theme gets iofusion, other themes stay', () => {
	const none = tmp();
	fs.writeFileSync(path.join(none, 'dashboard.yaml'), 'views: []\n');
	assert.strictEqual(migrateTheme(none), true);

	const muted = tmp();
	fs.writeFileSync(path.join(muted, 'dashboard.yaml'), 'theme: muted\nviews: []\n');
	assert.strictEqual(migrateTheme(muted), false);
	assert.match(fs.readFileSync(path.join(muted, 'dashboard.yaml'), 'utf8'), /theme: muted/);

	const empty = tmp();
	assert.strictEqual(migrateTheme(empty), false); // no dashboard yet: nothing to migrate
});

test('the WebSocket token survives restarts', () => {
	const dir = tmp();
	const first = loadToken(dir);
	assert.ok(first.length >= 32);
	assert.strictEqual(loadToken(dir), first);
});
