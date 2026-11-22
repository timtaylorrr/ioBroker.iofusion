'use strict';

const { nameOf } = require('./entities');

const LOW_BATTERY_PERCENT = 15;

const TEXT = {
	en: {
		lowBattery: 'Battery low',
		lowBatteryMsg: (name, value) => (value === undefined ? `${name}: the battery is low.` : `${name}: ${value} % battery left.`),
		unreach: 'Device not reachable',
		unreachMsg: (name) => `${name} is not reachable.`
	},
	de: {
		lowBattery: 'Batterie schwach',
		lowBatteryMsg: (name, value) => (value === undefined ? `${name}: Die Batterie ist schwach.` : `${name}: noch ${value} % Batterie.`),
		unreach: 'Gerät nicht erreichbar',
		unreachMsg: (name) => `${name} ist nicht erreichbar.`
	}
};

/**
 * A notification for one entity, or undefined if there is nothing to report.
 * @returns {{key: string, title: string, message: string} | undefined}
 */
function notificationFor(entityId, entry, state, lang = 'en') {
	const t = TEXT[lang === 'de' ? 'de' : 'en'];
	const role = String(entry.obj.common.role || '');
	const value = state?.val;
	const name = nameOf(entry.obj, entry.id);
	const key = `iofusion_${entityId.replace(/\./g, '_')}`;

	if (entry.domain === 'sensor' && role === 'value.battery' && typeof value === 'number' && value <= LOW_BATTERY_PERCENT) {
		return { key, title: t.lowBattery, message: t.lowBatteryMsg(name, Math.round(value)) };
	}
	if (entry.domain === 'binary_sensor' && /^indicator\.(maintenance\.)?lowbat$/.test(role) && value === true) {
		return { key, title: t.lowBattery, message: t.lowBatteryMsg(name) };
	}
	if (entry.domain === 'binary_sensor' && role === 'indicator.maintenance.unreach' && value === true) {
		return { key, title: t.unreach, message: t.unreachMsg(name) };
	}
	return undefined;
}

/** Keeps the current notifications and reports what changed. */
class Notifications {
	constructor() {
		this.items = new Map(); // key -> notification
		this.dismissed = new Set(); // keys the user closed while the condition still holds
	}

	toObject() {
		return Object.fromEntries(this.items);
	}

	/**
	 * Re-evaluate one entity.
	 * @returns {{type: 'added'|'updated'|'removed', notifications: object} | undefined}
	 */
	update(entityId, entry, state, lang, now = new Date()) {
		const key = `iofusion_${entityId.replace(/\./g, '_')}`;
		const found = notificationFor(entityId, entry, state, lang);
		const existing = this.items.get(key);

		if (!found) {
			this.dismissed.delete(key); // condition cleared: may notify again next time
			if (!existing) return undefined;
			this.items.delete(key);
			return { type: 'removed', notifications: { [key]: existing } };
		}
		if (this.dismissed.has(key)) return undefined;

		const note = {
			notification_id: key,
			title: found.title,
			message: found.message,
			created_at: existing?.created_at || now.toISOString(),
			status: 'unread'
		};
		if (existing && existing.message === note.message) return undefined;
		this.items.set(key, note);
		return { type: existing ? 'updated' : 'added', notifications: { [key]: note } };
	}

	dismiss(key) {
		const existing = this.items.get(key);
		if (!existing) return undefined;
		this.items.delete(key);
		this.dismissed.add(key);
		return { type: 'removed', notifications: { [key]: existing } };
	}
}

module.exports = { Notifications, notificationFor, LOW_BATTERY_PERCENT };
