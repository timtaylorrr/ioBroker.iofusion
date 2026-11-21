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
		if (!writable && role.startsWith('sensor')) return 'binary_sensor';
		if (role.startsWith('sensor')) return 'binary_sensor';
		return undefined;
	}
	if (type === 'number') {
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
			return typeof value === 'boolean' ? (value ? 'on' : 'off') : Number(value) > (obj.common.min ?? 0) ? 'on' : 'off';
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

function attributesOf(domain, id, obj, value) {
	const role = String(obj.common.role || '');
	const attributes = { friendly_name: nameOf(obj, id) };
	if (domain === 'sensor') {
		if (obj.common.unit) attributes.unit_of_measurement = obj.common.unit;
		if (typeof value === 'number') attributes.state_class = 'measurement';
		if (DEVICE_CLASS[role]) attributes.device_class = DEVICE_CLASS[role];
	} else if (domain === 'binary_sensor') {
		if (BINARY_CLASS[role]) attributes.device_class = BINARY_CLASS[role];
	} else if (domain === 'light') {
		if (obj.common.type === 'number') {
			attributes.supported_color_modes = ['brightness'];
			attributes.color_mode = 'brightness';
			attributes.brightness = value == null ? null : toBrightness(obj, value);
			attributes.supported_features = 0;
		} else {
			attributes.supported_color_modes = ['onoff'];
			attributes.color_mode = 'onoff';
			attributes.supported_features = 0;
		}
	}
	attributes.iobroker_id = id;
	return attributes;
}

/**
 * Build the entity registry: entity_id -> { id, obj, domain }
 * @param {Array<{id: string, obj: object}>} list
 */
function buildRegistry(list) {
	const registry = new Map();
	for (const { id, obj } of list) {
		const domain = domainOf(obj);
		if (!domain) continue;
		let entityId = `${domain}.${slug(id)}`;
		for (let i = 2; registry.has(entityId); i++) entityId = `${domain}.${slug(id)}_${i}`;
		registry.set(entityId, { id, obj, domain });
	}
	return registry;
}

/** Compressed entity as used by the `subscribe_entities` event */
function compressedEntity(entry, state) {
	const value = state ? state.val : null;
	const ts = (state && (state.lc || state.ts)) || Date.now();
	const ts2 = (state && state.ts) || ts;
	return {
		s: stateString(entry.domain, entry.obj, value),
		a: attributesOf(entry.domain, entry.id, entry.obj, value),
		c: `iofusion-${entry.id}`,
		lc: ts / 1000,
		lu: ts2 / 1000
	};
}

/**
 * Translate a Home Assistant service call to ioBroker writes.
 * @returns {{id: string, val: any}[] | undefined} undefined = unsupported service
 */
function serviceToWrites(entry, domain, service, data = {}) {
	const { id, obj } = entry;
	if (domain === 'switch' || (domain === 'light' && obj.common.type === 'boolean')) {
		if (service === 'turn_on') return [{ id, val: true }];
		if (service === 'turn_off') return [{ id, val: false }];
		if (service === 'toggle') return [{ id, val: null, toggle: true }];
	}
	if (domain === 'light' && obj.common.type === 'number') {
		const min = obj.common.min ?? 0;
		const max = obj.common.max ?? 100;
		if (service === 'turn_off') return [{ id, val: min }];
		if (service === 'turn_on') {
			if (data.brightness !== undefined) return [{ id, val: fromBrightness(obj, data.brightness) }];
			if (data.brightness_pct !== undefined) {
				return [{ id, val: Math.round(min + (data.brightness_pct / 100) * (max - min)) }];
			}
			return [{ id, val: max }];
		}
		if (service === 'toggle') return [{ id, val: null, toggle: true }];
	}
	if (domain === 'button' && service === 'press') return [{ id, val: true }];
	return undefined;
}

module.exports = {
	nameOf,
	slug,
	domainOf,
	buildRegistry,
	compressedEntity,
	serviceToWrites,
	stateString,
	toBrightness,
	fromBrightness
};
