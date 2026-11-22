'use strict';

/**
 * Maps ioBroker state objects to Home Assistant style entities.
 * Pure functions, no I/O, so they can be unit tested.
 */

const DEVICE_CLASS = {
	'value.temperature': 'temperature',
	'sensor.temperature': 'temperature',
	'level.temperature': 'temperature',
	'value.humidity': 'humidity',
	'sensor.humidity': 'humidity',
	'level.humidity': 'humidity',
	'value.battery': 'battery',
	'value.power': 'power',
	'value.power.consumption': 'energy',
	'value.energy': 'energy',
	'value.pressure': 'pressure',
	'value.illuminance': 'illuminance',
	'value.brightness': 'illuminance',
	'value.voltage': 'voltage',
	'value.current': 'current'
};

const BINARY_CLASS = {
	'sensor.motion': 'motion',
	'sensor.window': 'window',
	'sensor.door': 'door',
	'sensor.lock': 'lock',
	'sensor.alarm.flood': 'moisture',
	'sensor.alarm.fire': 'smoke',
	'sensor.alarm.power': 'power'
};

// Home Assistant supported_features bit flags
const COVER = { OPEN: 1, CLOSE: 2, SET_POSITION: 4, STOP: 8 };
const CLIMATE = { TARGET_TEMPERATURE: 1 };

const COVER_ROLE = /^level\.(blind|curtain|shutter)(\.|$)/;
const COVER_CLASS = { blind: 'blind', curtain: 'curtain', shutter: 'shutter' };

/** ioBroker names can be a string or a { en, de, ... } object */
function nameOf(obj, id) {
	const name = obj?.common?.name;
	if (typeof name === 'string' && name) return name;
	if (name && typeof name === 'object') {
		return name.de || name.en || Object.values(name).find(Boolean) || id;
	}
	return id;
}

/** `0_userdata.0.Wohnzimmer.Licht` -> `0_userdata_0_wohnzimmer_licht` */
function slug(id) {
	return id
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
}

const parentOf = (id) => id.split('.').slice(0, -1).join('.');

/**
 * Decide which Home Assistant domain a state object belongs to.
 * Returns undefined if the state is not interesting for a dashboard.
 */
function domainOf(obj) {
	const common = obj?.common;
	if (!common || obj.type !== 'state') return undefined;
	const role = String(common.role || '');
	const type = common.type;
	const writable = common.write !== false;

	if (type === 'boolean') {
		if (role.startsWith('button')) return writable ? 'button' : undefined;
		if (writable && role.startsWith('switch')) {
			return role.includes('light') ? 'light' : 'switch';
		}
		if (role.startsWith('sensor')) return 'binary_sensor';
		return undefined;
	}
	if (type === 'number') {
		if (writable && COVER_ROLE.test(role)) return 'cover';
		if (writable && role === 'level.temperature') return 'climate';
		if (writable && (role === 'level.dimmer' || role === 'level.brightness')) return 'light';
		if (role.startsWith('value') || role.startsWith('sensor') || role.startsWith('level.')) {
			return 'sensor';
		}
		return undefined;
	}
	return undefined;
}

function stateString(domain, obj, value) {
	if (value === null || value === undefined) return 'unknown';
	switch (domain) {
		case 'switch':
		case 'binary_sensor':
			return value ? 'on' : 'off';
		case 'light':
			return typeof value === 'boolean'
				? value
					? 'on'
					: 'off'
				: Number(value) > (obj.common.min ?? 0)
					? 'on'
					: 'off';
		case 'button':
			return 'unknown';
		default:
			return typeof value === 'number' ? String(Math.round(value * 1000) / 1000) : String(value);
	}
}

/** Dimmer value -> 0..255 and back */
function toBrightness(obj, value) {
	const min = obj.common.min ?? 0;
	const max = obj.common.max ?? 100;
	if (max === min) return 0;
	return Math.round(((Number(value) - min) / (max - min)) * 255);
}
function fromBrightness(obj, brightness) {
	const min = obj.common.min ?? 0;
	const max = obj.common.max ?? 100;
	return Math.round(min + (Math.max(0, Math.min(255, brightness)) / 255) * (max - min));
}

/** Cover: ioBroker value <-> Home Assistant position (0 closed .. 100 open) */
function toPosition(entry, value) {
	const min = entry.obj.common.min ?? 0;
	const max = entry.obj.common.max ?? 100;
	if (max === min || value === null || value === undefined) return undefined;
	let position = ((Number(value) - min) / (max - min)) * 100;
	if (entry.invert) position = 100 - position;
	return Math.round(Math.max(0, Math.min(100, position)));
}
function fromPosition(entry, position) {
	const min = entry.obj.common.min ?? 0;
	const max = entry.obj.common.max ?? 100;
	let p = Math.max(0, Math.min(100, Number(position)));
	if (entry.invert) p = 100 - p;
	return Math.round(min + (p / 100) * (max - min));
}

function attributesOf(entry, value, getState) {
	const { domain, id, obj } = entry;
	const role = String(obj.common.role || '');
	const attributes = { friendly_name: nameOf(obj, id) };

	if (domain === 'sensor') {
		if (obj.common.unit) attributes.unit_of_measurement = obj.common.unit;
		if (typeof value === 'number') attributes.state_class = 'measurement';
		if (DEVICE_CLASS[role]) attributes.device_class = DEVICE_CLASS[role];
	} else if (domain === 'binary_sensor') {
		if (BINARY_CLASS[role]) attributes.device_class = BINARY_CLASS[role];
	} else if (domain === 'light') {
		attributes.supported_features = 0;
		if (obj.common.type === 'number') {
			attributes.supported_color_modes = ['brightness'];
			attributes.color_mode = 'brightness';
			attributes.brightness = value == null ? null : toBrightness(obj, value);
		} else {
			attributes.supported_color_modes = ['onoff'];
			attributes.color_mode = 'onoff';
		}
	} else if (domain === 'cover') {
		const kind = role.split('.')[1];
		attributes.device_class = COVER_CLASS[kind] || 'shutter';
		attributes.current_position = toPosition(entry, value);
		attributes.supported_features =
			COVER.OPEN | COVER.CLOSE | COVER.SET_POSITION | (entry.related.stop ? COVER.STOP : 0);
	} else if (domain === 'climate') {
		const current = entry.related.current ? getState?.(entry.related.current)?.val : undefined;
		attributes.temperature = value ?? null;
		if (typeof current === 'number') attributes.current_temperature = current;
		attributes.min_temp = obj.common.min ?? 5;
		attributes.max_temp = obj.common.max ?? 30;
		attributes.target_temp_step = obj.common.step ?? 0.5;
		attributes.temperature_unit = obj.common.unit || '°C';
		attributes.hvac_modes = ['heat'];
		attributes.supported_features = CLIMATE.TARGET_TEMPERATURE;
	}
	attributes.iobroker_id = id;
	return attributes;
}

/**
 * Build the entity registry: entity_id -> { id, obj, domain, related, invert }
 * Climate and cover entities look at their sibling states (same channel) to find
 * the measured temperature or a stop button.
 * @param {Array<{id: string, obj: object}>} list
 * @param {{invertCover?: boolean}} [options]
 */
function buildRegistry(list, options = {}) {
	const siblings = new Map();
	for (const { id, obj } of list) {
		const parent = parentOf(id);
		if (!siblings.has(parent)) siblings.set(parent, []);
		siblings.get(parent).push({ id, obj });
	}

	const registry = new Map();
	for (const { id, obj } of list) {
		const domain = domainOf(obj);
		if (!domain) continue;
		let entityId = `${domain}.${slug(id)}`;
		for (let i = 2; registry.has(entityId); i++) entityId = `${domain}.${slug(id)}_${i}`;

		const related = {};
		const near = siblings.get(parentOf(id)) || [];
		if (domain === 'climate') {
			const measured =
				near.find((s) => s.obj.common.role === 'value.temperature' && s.obj.common.type === 'number') ||
				near.find((s) => s.obj.common.role === 'sensor.temperature' && s.obj.common.type === 'number');
			if (measured) related.current = measured.id;
		} else if (domain === 'cover') {
			const stop = near.find(
				(s) =>
					s.obj.common.type === 'boolean' &&
					s.obj.common.write !== false &&
					/stop/i.test(`${s.obj.common.role} ${s.id.split('.').pop()}`)
			);
			if (stop) related.stop = stop.id;
		}
		registry.set(entityId, { id, obj, domain, related, invert: !!options.invertCover });
	}
	return registry;
}

/** All ioBroker ids whose changes affect this entity */
function sourceIds(entry) {
	return [entry.id, ...Object.values(entry.related)];
}

/** Compressed entity as used by the `subscribe_entities` event */
function compressedEntity(entry, state, getState) {
	const value = state ? state.val : null;
	const ts = (state && (state.lc || state.ts)) || Date.now();
	const ts2 = (state && state.ts) || ts;
	let s;
	if (entry.domain === 'cover') {
		const position = toPosition(entry, value);
		s = position === undefined ? 'unknown' : position > 0 ? 'open' : 'closed';
	} else if (entry.domain === 'climate') {
		s = value === null || value === undefined ? 'unavailable' : 'heat';
	} else {
		s = stateString(entry.domain, entry.obj, value);
	}
	return {
		s,
		a: attributesOf(entry, value, getState),
		c: `iofusion-${entry.id}`,
		lc: ts / 1000,
		lu: ts2 / 1000
	};
}

/**
 * Translate a Home Assistant service call to ioBroker writes.
 * @param {object} entry registry entry
 * @param {any} current current ioBroker value of the entity's state
 * @returns {{id: string, val: any}[] | undefined} undefined = unsupported service
 */
function serviceToWrites(entry, domain, service, data = {}, current) {
	const { id, obj } = entry;
	const min = obj.common.min ?? 0;
	const max = obj.common.max ?? 100;

	if (domain === 'switch' || (domain === 'light' && obj.common.type === 'boolean')) {
		if (service === 'turn_on') return [{ id, val: true }];
		if (service === 'turn_off') return [{ id, val: false }];
		if (service === 'toggle') return [{ id, val: !current }];
	}
	if (domain === 'light' && obj.common.type === 'number') {
		if (service === 'turn_off') return [{ id, val: min }];
		if (service === 'turn_on') {
			if (data.brightness !== undefined) return [{ id, val: fromBrightness(obj, data.brightness) }];
			if (data.brightness_pct !== undefined) {
				return [{ id, val: Math.round(min + (data.brightness_pct / 100) * (max - min)) }];
			}
			return [{ id, val: max }];
		}
		if (service === 'toggle') return [{ id, val: Number(current) > min ? min : max }];
	}
	if (domain === 'button' && service === 'press') return [{ id, val: true }];

	if (domain === 'cover') {
		if (service === 'open_cover') return [{ id, val: fromPosition(entry, 100) }];
		if (service === 'close_cover') return [{ id, val: fromPosition(entry, 0) }];
		if (service === 'set_cover_position' && data.position !== undefined) {
			return [{ id, val: fromPosition(entry, data.position) }];
		}
		if (service === 'toggle') {
			const position = toPosition(entry, current) ?? 0;
			return [{ id, val: fromPosition(entry, position > 0 ? 0 : 100) }];
		}
		if (service === 'stop_cover' && entry.related.stop) return [{ id: entry.related.stop, val: true }];
	}

	if (domain === 'climate') {
		if (service === 'set_temperature' && data.temperature !== undefined) {
			const lo = obj.common.min ?? 5;
			const hi = obj.common.max ?? 30;
			return [{ id, val: Math.max(lo, Math.min(hi, Number(data.temperature))) }];
		}
		// only one mode (heat) is exposed, so this is a no-op
		if (service === 'set_hvac_mode') return [];
	}
	return undefined;
}

module.exports = {
	nameOf,
	slug,
	domainOf,
	buildRegistry,
	sourceIds,
	compressedEntity,
	serviceToWrites,
	stateString,
	toBrightness,
	fromBrightness,
	toPosition,
	fromPosition
};
