'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { buildRegistry, compressedEntity, serviceToWrites, slug } = require('../lib/entities');

const state = (name, role, type, extra = {}) => ({
	type: 'state',
	common: { name, role, type, write: true, ...extra }
});

test('slug creates valid entity ids', () => {
	assert.strictEqual(slug('0_userdata.0.Wohnzimmer.Licht'), '0_userdata_0_wohnzimmer_licht');
});

test('roles map to domains and duplicate slugs are disambiguated', () => {
	const reg = buildRegistry([
		{ id: 'a.b', obj: state('A', 'switch', 'boolean') },
		{ id: 'a_b', obj: state('B', 'switch', 'boolean') },
		{ id: 'x.t', obj: state('T', 'value.temperature', 'number', { write: false, unit: '°C' }) },
		{ id: 'x.text', obj: state('Text', 'text', 'string') }
	]);
	assert.deepStrictEqual([...reg.keys()], ['switch.a_b', 'switch.a_b_2', 'sensor.x_t']);
});

test('dimmer maps to brightness and back', () => {
	const reg = buildRegistry([{ id: 'd', obj: state('D', 'level.dimmer', 'number', { min: 0, max: 100 }) }]);
	const entry = reg.get('light.d');
	const e = compressedEntity(entry, { val: 50, ts: 1000 });
	assert.strictEqual(e.s, 'on');
	assert.strictEqual(e.a.brightness, 128);
	assert.deepStrictEqual(serviceToWrites(entry, 'light', 'turn_on', { brightness_pct: 80 }), [{ id: 'd', val: 80 }]);
	assert.deepStrictEqual(serviceToWrites(entry, 'light', 'turn_off'), [{ id: 'd', val: 0 }]);
	assert.strictEqual(serviceToWrites(entry, 'climate', 'set_temperature'), undefined);
});
