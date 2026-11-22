'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { buildRegistry } = require('../lib/entities');
const { Notifications, notificationFor } = require('../lib/notifications');

const st = (name, role, type, extra = {}) => ({ type: 'state', common: { name, role, type, write: false, ...extra } });
const registry = buildRegistry([
	{ id: 'z.0.A.battery', obj: st('Sensor Garten', 'value.battery', 'number', { unit: '%' }) },
	{ id: 'z.0.B.lowbat', obj: st('Tür', 'indicator.maintenance.lowbat', 'boolean') },
	{ id: 'z.0.C.unreach', obj: st('Lampe', 'indicator.maintenance.unreach', 'boolean') }
]);
const [bat, low, unreach] = [...registry];

test('low battery and unreachable devices are reported', () => {
	assert.strictEqual(notificationFor(bat[0], bat[1], { val: 80 }), undefined);
	assert.match(notificationFor(bat[0], bat[1], { val: 9 }, 'en').message, /9 % battery/);
	assert.match(notificationFor(bat[0], bat[1], { val: 9 }, 'de').message, /noch 9 % Batterie/);
	assert.ok(notificationFor(low[0], low[1], { val: true }));
	assert.strictEqual(notificationFor(low[0], low[1], { val: false }), undefined);
	assert.match(notificationFor(unreach[0], unreach[1], { val: true }, 'de').title, /nicht erreichbar/);
});

test('notifications are added, updated, removed and can be dismissed', () => {
	const n = new Notifications();
	assert.strictEqual(n.update(bat[0], bat[1], { val: 80 }, 'en'), undefined);

	const added = n.update(bat[0], bat[1], { val: 14 }, 'en', new Date(0));
	assert.strictEqual(added.type, 'added');
	const key = Object.keys(added.notifications)[0];
	assert.strictEqual(added.notifications[key].status, 'unread');
	assert.strictEqual(n.update(bat[0], bat[1], { val: 14 }, 'en'), undefined); // unchanged

	const updated = n.update(bat[0], bat[1], { val: 12 }, 'en');
	assert.strictEqual(updated.type, 'updated');
	assert.strictEqual(updated.notifications[key].created_at, new Date(0).toISOString());

	const removed = n.dismiss(key);
	assert.strictEqual(removed.type, 'removed');
	assert.deepStrictEqual(n.toObject(), {});
	// dismissed stays quiet while the condition holds, and comes back after it cleared
	assert.strictEqual(n.update(bat[0], bat[1], { val: 10 }, 'en'), undefined);
	n.update(bat[0], bat[1], { val: 90 }, 'en');
	assert.strictEqual(n.update(bat[0], bat[1], { val: 5 }, 'en').type, 'added');

	const cleared = n.update(bat[0], bat[1], { val: 95 }, 'en');
	assert.strictEqual(cleared.type, 'removed');
});
