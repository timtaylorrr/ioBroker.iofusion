'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { buildRegistry } = require('../lib/entities');
const { listStatisticIds, statisticsDuringPeriod, historyStream, pickGraphEntities } = require('../lib/history');

const sensor = (name, role, type, extra = {}, custom) => ({
	type: 'state',
	common: { name, role, type, write: false, ...extra, ...(custom ? { custom } : {}) }
});
const on = { 'history.0': { enabled: true } };
const registry = buildRegistry([
	{ id: 'a.temp', obj: sensor('T', 'value.temperature', 'number', { unit: '°C' }, on) },
	{ id: 'a.power', obj: sensor('P', 'value.power', 'number', {}, on) },
	{ id: 'a.nohist', obj: sensor('N', 'value.humidity', 'number') },
	{ id: 'a.door', obj: sensor('D', 'sensor.door', 'boolean', {}, on) }
]);

test('only numeric sensors with history are listed', () => {
	const ids = listStatisticIds(registry, 'history.0').map((s) => s.statistic_id);
	assert.deepStrictEqual(ids, ['sensor.a_temp', 'sensor.a_power']);
	assert.deepStrictEqual(listStatisticIds(registry, ''), []);
	assert.strictEqual(listStatisticIds(registry, 'history.0')[0].display_unit_of_measurement, '°C');
});

test('statistics are averaged per period and skip entities without history', async () => {
	const calls = [];
	const iob = {
		historyInstance: 'history.0',
		history: async (id, opts) => {
			calls.push({ id, ...opts });
			return [{ ts: 3_600_000, val: 20.12345 }, { ts: 0, val: 19 }, { ts: 7_200_000, val: null }];
		}
	};
	const res = await statisticsDuringPeriod(iob, registry, {
		start_time: new Date(0).toISOString(),
		end_time: new Date(10_800_000).toISOString(),
		statistic_ids: ['sensor.a_temp', 'sensor.a_nohist', 'sensor.unknown'],
		period: 'hour'
	});
	assert.deepStrictEqual(Object.keys(res), ['sensor.a_temp']);
	assert.strictEqual(calls.length, 1);
	assert.strictEqual(calls[0].step, 3_600_000);
	assert.strictEqual(calls[0].aggregate, 'average');
	assert.deepStrictEqual(res['sensor.a_temp'].map((r) => [r.start, r.mean]), [[0, 19], [3_600_000, 20.123]]);
});

test('no history adapter configured gives empty results', async () => {
	assert.deepStrictEqual(await statisticsDuringPeriod({}, registry, { statistic_ids: ['sensor.a_temp'] }), {});
});

test('timeline falls back to the current state and covers the whole window', async () => {
	const states = new Map([['a.door', { val: true }]]);
	const start = 1_000_000;
	const end = 2_000_000;
	const stream = await historyStream({ historyInstance: 'history.0', history: async () => [] }, registry, states, {
		entity_ids: ['binary_sensor.a_door'],
		start_time: new Date(start).toISOString(),
		end_time: new Date(end).toISOString()
	});
	assert.strictEqual(stream.start_time, 1000);
	assert.deepStrictEqual(stream.states['binary_sensor.a_door'], [{ s: 'on', lu: 1000 }]);

	const withRows = await historyStream(
		{ historyInstance: 'history.0', history: async () => [{ ts: 1_500_000, val: false }] },
		registry,
		states,
		{ entity_ids: ['binary_sensor.a_door'], start_time: new Date(start).toISOString(), end_time: new Date(end).toISOString() }
	);
	assert.deepStrictEqual(withRows.states['binary_sensor.a_door'].map((e) => e.s), ['off', 'off']);
});

test('graph picks prefer temperature, then power', () => {
	assert.deepStrictEqual(pickGraphEntities(registry, 'history.0', 1), ['sensor.a_temp']);
	assert.deepStrictEqual(pickGraphEntities(registry, 'history.0'), ['sensor.a_temp', 'sensor.a_power']);
});
