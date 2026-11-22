'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { buildRegistry } = require('../lib/entities');
const { buildDashboard, resolveRooms, shortName, belongsTo } = require('../lib/dashboard');

const state = (name, role, type, extra = {}) => ({ type: 'state', common: { name, role, type, write: true, ...extra } });

const list = [
	{ id: 'hm.0.L1.1.STATE', obj: state('Wohnzimmer Licht', 'switch.light', 'boolean') },
	{ id: 'hm.0.T1.1.TEMP', obj: state('Wohnzimmer Temperatur', 'value.temperature', 'number', { write: false }) },
	{ id: 'hm.0.B1.1.LEVEL', obj: state('Rollladen Schlafzimmer', 'level.blind', 'number') },
	{ id: 'x.0.free', obj: state('Frei', 'switch', 'boolean') }
];
const rooms = [
	{ id: 'enum.rooms.wz', name: 'Wohnzimmer', members: ['hm.0.L1', 'hm.0.T1.1.TEMP'] },
	{ id: 'enum.rooms.sz', name: 'Schlafzimmer', members: ['hm.0.B1.1.LEVEL'] },
	{ id: 'enum.rooms.leer', name: 'Leer', members: ['nothing.here'] }
];

test('members match states, channels and devices by id prefix', () => {
	assert.ok(belongsTo('hm.0.L1.1.STATE', 'hm.0.L1'));
	assert.ok(belongsTo('hm.0.L1.1.STATE', 'hm.0.L1.1.STATE'));
	assert.ok(!belongsTo('hm.0.L10.1.STATE', 'hm.0.L1'));
});

test('rooms resolve to entities, empty rooms stay empty', () => {
	const resolved = resolveRooms(buildRegistry(list), rooms);
	assert.deepStrictEqual(resolved.map((r) => r.entityIds.length), [2, 1, 0]);
});

test('dashboard has a view per non-empty room, groups by type and shortens names', () => {
	const dashboard = buildDashboard({ registry: buildRegistry(list), rooms, lang: 'de' });
	assert.deepStrictEqual(dashboard.views.map((v) => v.name), ['Wohnzimmer', 'Schlafzimmer', 'Weitere']);
	const wz = dashboard.views[0];
	assert.strictEqual(wz.icon, 'mdi:sofa');
	const groups = wz.sections;
	assert.deepStrictEqual(groups.map((g) => g.name), ['Licht & Schalter', 'Sensoren']);
	assert.strictEqual(groups[0].items[0].name, 'Licht');
	assert.strictEqual(groups[0].items[0].entity_id, 'light.hm_0_l1_1_state');
	// ids are unique
	const ids = JSON.stringify(dashboard).match(/"id":(\d+)/g);
	assert.strictEqual(new Set(ids).size, ids.length);
});

test('unassigned entities get no view when there are too many', () => {
	const dashboard = buildDashboard({ registry: buildRegistry(list), rooms, lang: 'en', maxUnassigned: 0 });
	assert.ok(!dashboard.views.some((v) => v.name === 'Other'));
});

test('shortName only strips a real room prefix', () => {
	assert.strictEqual(shortName('Küche Licht', 'Küche'), 'Licht');
	assert.strictEqual(shortName('Küche', 'Küche'), undefined);
	assert.strictEqual(shortName('Bad', 'Küche'), undefined);
});
