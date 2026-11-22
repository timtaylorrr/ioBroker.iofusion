'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { Bridge } = require('../lib/bridge');

const st = (name, role, type, extra = {}) => ({ type: 'state', common: { name, role, type, write: true, ...extra } });

async function setup() {
	const writes = [];
	const list = [
		{ id: 'knx.0.Licht', obj: st('Licht', 'switch', 'boolean'), state: { val: false } },
		{ id: 'x.0.dim', obj: st('Dimmer', 'level.dimmer', 'number', { min: 0, max: 100 }), state: { val: 0 } },
		{ id: 'x.0.btn', obj: st('Szene', 'button', 'boolean'), state: { val: false } }
	];
	const bridge = new Bridge({ list: async () => list, setState: async (id, val) => writes.push([id, val]), onStateChange: () => {} }, { token: 't', log: { info() {} } });
	await bridge.init();
	const replies = [];
	const client = { ws: { readyState: 1, OPEN: 1, send: (m) => replies.push(JSON.parse(m)) }, authed: true, entitySubs: new Set(), notificationSubs: new Set() };
	const call = (domain, service, entity_id, extra = {}) => bridge.onMessage(client, { id: replies.length + 1, type: 'call_service', domain, service, service_data: { entity_id, ...extra } });
	return { writes, replies, call };
}

test('homeassistant.toggle and turn_on/turn_off act on the entity\'s own domain', async () => {
	const { writes, replies, call } = await setup();
	await call('homeassistant', 'toggle', 'switch.knx_0_licht');
	await call('homeassistant', 'turn_on', 'light.x_0_dim');
	await call('homeassistant', 'turn_off', 'switch.knx_0_licht');
	assert.deepStrictEqual(writes, [['knx.0.Licht', true], ['x.0.dim', 100], ['knx.0.Licht', false]]);
	assert.ok(replies.every((r) => r.success));
});

test('homeassistant.turn_on presses a button (scene-like)', async () => {
	const { writes, replies, call } = await setup();
	await call('homeassistant', 'turn_on', 'button.x_0_btn');
	assert.ok(replies[0].success);
	assert.deepStrictEqual(writes, [['x.0.btn', true]]);
});

test('unsupported services for an entity say so and write nothing', async () => {
	const { writes, replies, call } = await setup();
	await call('homeassistant', 'turn_off', 'button.x_0_btn');
	assert.strictEqual(replies[0].success, false);
	assert.strictEqual(replies[0].error.code, 'service_not_found');
	assert.deepStrictEqual(writes, []);
});

test('unknown entities are reported', async () => {
	const { replies, call } = await setup();
	await call('switch', 'toggle', 'switch.does_not_exist');
	assert.strictEqual(replies[0].error.code, 'not_found');
});
