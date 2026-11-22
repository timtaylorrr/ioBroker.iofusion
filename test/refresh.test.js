'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { Bridge } = require('../lib/bridge');

const st = (name, role, type) => ({ type: 'state', common: { name, role, type, write: true } });

test('refresh adds new entities and reports removed ones to subscribers', async () => {
	let list = [
		{ id: 'a.0.one', obj: st('One', 'switch', 'boolean'), state: { val: true } },
		{ id: 'a.0.two', obj: st('Two', 'switch', 'boolean'), state: { val: false } }
	];
	const bridge = new Bridge({ list: async () => list, setState: async () => {}, onStateChange: () => {} }, { token: 't', log: { info() {} } });
	await bridge.init();
	assert.strictEqual(bridge.registry.size, 2);

	const sent = [];
	bridge.send = (ws, message) => sent.push(message);
	bridge.clients.add({ ws: {}, entitySubs: new Set([7]), notificationSubs: new Set() });

	list = [
		{ id: 'a.0.two', obj: st('Two', 'switch', 'boolean'), state: { val: true } },
		{ id: 'a.0.three', obj: st('Three', 'switch', 'boolean'), state: { val: false } }
	];
	await bridge.refresh();
	assert.deepStrictEqual([...bridge.registry.keys()], ['switch.a_0_two', 'switch.a_0_three']);
	assert.strictEqual(sent.length, 1);
	assert.strictEqual(sent[0].id, 7);
	assert.deepStrictEqual(sent[0].event.r, ['switch.a_0_one']);
	assert.deepStrictEqual(Object.keys(sent[0].event.a), ['switch.a_0_two', 'switch.a_0_three']);
	assert.strictEqual(sent[0].event.a['switch.a_0_two'].s, 'on');
});
