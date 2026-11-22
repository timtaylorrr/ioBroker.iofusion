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

test('thermostat: setpoint becomes climate with measured temperature from the same channel', () => {
	const list = [
		{ id: 'hm.0.T.1.SET', obj: state('Heizung', 'level.temperature', 'number', { min: 6, max: 30 }) },
		{ id: 'hm.0.T.1.ACT', obj: state('Ist', 'value.temperature', 'number', { write: false }) },
		{ id: 'hm.0.X.1.TEMP', obj: state('Fremd', 'value.temperature', 'number', { write: false }) }
	];
	const reg = buildRegistry(list);
	const entry = reg.get('climate.hm_0_t_1_set');
	assert.strictEqual(entry.related.current, 'hm.0.T.1.ACT');
	const states = { 'hm.0.T.1.ACT': { val: 20.5 } };
	const e = compressedEntity(entry, { val: 22 }, (id) => states[id]);
	assert.strictEqual(e.s, 'heat');
	assert.strictEqual(e.a.temperature, 22);
	assert.strictEqual(e.a.current_temperature, 20.5);
	assert.strictEqual(e.a.min_temp, 6);
	assert.strictEqual(e.a.supported_features, 1);
	assert.deepStrictEqual(serviceToWrites(entry, 'climate', 'set_temperature', { temperature: 99 }), [
		{ id: 'hm.0.T.1.SET', val: 30 }
	]);
	assert.deepStrictEqual(serviceToWrites(entry, 'climate', 'set_hvac_mode', { hvac_mode: 'heat' }), []);
});

test('blinds: position, stop button, toggle and inversion', () => {
	const list = [
		{ id: 'hm.0.B.1.LEVEL', obj: state('Rollladen', 'level.blind', 'number', { min: 0, max: 100 }) },
		{ id: 'hm.0.B.1.STOP', obj: state('Stop', 'button.stop', 'boolean') }
	];
	const entry = buildRegistry(list).get('cover.hm_0_b_1_level');
	assert.strictEqual(entry.related.stop, 'hm.0.B.1.STOP');
	const open = compressedEntity(entry, { val: 60 });
	assert.strictEqual(open.s, 'open');
	assert.strictEqual(open.a.current_position, 60);
	assert.strictEqual(open.a.supported_features, 15);
	assert.strictEqual(compressedEntity(entry, { val: 0 }).s, 'closed');
	assert.deepStrictEqual(serviceToWrites(entry, 'cover', 'set_cover_position', { position: 30 }), [
		{ id: 'hm.0.B.1.LEVEL', val: 30 }
	]);
	assert.deepStrictEqual(serviceToWrites(entry, 'cover', 'toggle', {}, 60), [{ id: 'hm.0.B.1.LEVEL', val: 0 }]);
	assert.deepStrictEqual(serviceToWrites(entry, 'cover', 'stop_cover'), [{ id: 'hm.0.B.1.STOP', val: true }]);

	const inverted = buildRegistry(list, { invertCover: true }).get('cover.hm_0_b_1_level');
	assert.strictEqual(compressedEntity(inverted, { val: 100 }).s, 'closed');
	assert.deepStrictEqual(serviceToWrites(inverted, 'cover', 'open_cover'), [{ id: 'hm.0.B.1.LEVEL', val: 0 }]);

	const noStop = buildRegistry([list[0]]).get('cover.hm_0_b_1_level');
	assert.strictEqual(compressedEntity(noStop, { val: 5 }).a.supported_features, 7);
	assert.strictEqual(serviceToWrites(noStop, 'cover', 'stop_cover'), undefined);
});
