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
const MEDIA = { PAUSE: 1, VOLUME_SET: 4, PREVIOUS_TRACK: 16, NEXT_TRACK: 32, VOLUME_STEP: 1024, STOP: 4096, PLAY: 16384 };
const CLIMATE = { TARGET_TEMPERATURE: 1 };

const INDICATOR_CLASS = {
	'indicator.reachable': { device_class: 'connectivity' },
	'indicator.connected': { device_class: 'connectivity' },
	'indicator.maintenance.unreach': { device_class: 'problem' },
	'indicator.maintenance.lowbat': { device_class: 'battery' },
	'indicator.lowbat': { device_class: 'battery' },
	'indicator.maintenance.alarm': { device_class: 'problem' }
};

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

	if (role === 'media.state') return 'media_player';

	if (type === 'boolean') {
		if (INDICATOR_CLASS[role]) return 'binary_sensor';
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

// ---------- light ----------

const hexToRgb = (hex) => {
	const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
	if (!m) return undefined;
	const n = parseInt(m[1], 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = ([r, g, b]) =>
	'#' + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');

/** Color temperature: Kelvin or mired, decided by unit or range */
function ctIsMired(obj) {
	const unit = String(obj.common.unit || '').toLowerCase();
	if (unit.includes('mired') || unit === 'mireds') return true;
	if (unit.includes('k')) return false;
	return (obj.common.max ?? 6500) <= 1000;
}
const ctToKelvin = (obj, v) => Math.round(ctIsMired(obj) ? 1e6 / Number(v) : Number(v));
const kelvinToCt = (obj, k) => Math.round(ctIsMired(obj) ? 1e6 / Number(k) : Number(k));

function lightAttributes(entry, value, getState) {
	const { obj, related } = entry;
	const attributes = { supported_features: 0 };
	const modes = [];
	const val = (id) => (id ? getState?.(id)?.val : undefined);

	const dimmer = obj.common.type === 'number' ? obj : entry.relatedObjs?.brightness;
	const brightnessValue = obj.common.type === 'number' ? value : val(related.brightness);
	if (dimmer) attributes.brightness = brightnessValue == null ? null : toBrightness(dimmer, brightnessValue);

	if (related.rgb) {
		modes.push('rgb');
		const rgb = hexToRgb(val(related.rgb));
		if (rgb) attributes.rgb_color = rgb;
	}
	if (related.hue && related.sat) {
		modes.push('hs');
		const h = val(related.hue);
		const sat = val(related.sat);
		if (typeof h === 'number' && typeof sat === 'number') attributes.hs_color = [h, sat];
	}
	if (related.ct) {
		modes.push('color_temp');
		const ctObj = entry.relatedObjs.ct;
		const raw = val(related.ct);
		const lo = ctObj.common.min;
		const hi = ctObj.common.max;
		if (typeof raw === 'number') attributes.color_temp_kelvin = ctToKelvin(ctObj, raw);
		if (lo !== undefined && hi !== undefined) {
			const a = ctToKelvin(ctObj, lo);
			const b = ctToKelvin(ctObj, hi);
			attributes.min_color_temp_kelvin = Math.min(a, b);
			attributes.max_color_temp_kelvin = Math.max(a, b);
		} else {
			attributes.min_color_temp_kelvin = 2000;
			attributes.max_color_temp_kelvin = 6500;
		}
	}
	if (!modes.length) modes.push(dimmer ? 'brightness' : 'onoff');
	attributes.supported_color_modes = modes;
	attributes.color_mode = modes[0];
	return attributes;
}

// ---------- media player ----------

function mediaState(value) {
	if (value === null || value === undefined) return 'unknown';
	if (typeof value === 'boolean') return value ? 'playing' : 'paused';
	if (typeof value === 'number') return value === 1 ? 'playing' : value === 2 ? 'paused' : 'idle';
	const v = String(value).toLowerCase();
	if (['play', 'playing', 'true', 'on'].includes(v)) return 'playing';
	if (['pause', 'paused'].includes(v)) return 'paused';
	if (['stop', 'stopped', 'idle', 'standby'].includes(v)) return 'idle';
	if (['off', 'false'].includes(v)) return 'off';
	return 'idle';
}

function mediaAttributes(entry, getState) {
	const { related } = entry;
	const val = (id) => (id ? getState?.(id)?.val : undefined);
	const attributes = {};
	const title = val(related.title);
	const artist = val(related.artist);
	const cover = val(related.cover);
	if (title) attributes.media_title = String(title);
	if (artist) attributes.media_artist = String(artist);
	if (cover && /^(https?:)?\/\//.test(String(cover))) attributes.entity_picture = String(cover);
	if (related.volume) {
		const obj = entry.relatedObjs.volume;
		const min = obj.common.min ?? 0;
		const max = obj.common.max ?? 100;
		const v = val(related.volume);
		if (typeof v === 'number' && max !== min) attributes.volume_level = Math.round(((v - min) / (max - min)) * 100) / 100;
	}
	let features = 0;
	if (related.play) features |= MEDIA.PLAY;
	if (related.pause) features |= MEDIA.PAUSE;
	if (related.stop) features |= MEDIA.STOP;
	if (related.next) features |= MEDIA.NEXT_TRACK;
	if (related.prev) features |= MEDIA.PREVIOUS_TRACK;
	if (related.volume) features |= MEDIA.VOLUME_SET | MEDIA.VOLUME_STEP;
	attributes.supported_features = features;
	return attributes;
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
		const cls = BINARY_CLASS[role] || INDICATOR_CLASS[role]?.device_class;
		if (cls) attributes.device_class = cls;
	} else if (domain === 'light') {
		Object.assign(attributes, lightAttributes(entry, value, getState));
	} else if (domain === 'media_player') {
		Object.assign(attributes, mediaAttributes(entry, getState));
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

const roleOf = (item) => String(item.obj.common.role || '');
const isWritable = (item) => item.obj.common.write !== false;
const lastSegment = (id) => id.split('.').pop();

/** Related states of a light: brightness (for switches), colors */
function lightRelations(near, anchor) {
	const related = {};
	const pick = (pred) => near.find((s) => s.id !== anchor.id && pred(s));
	if (anchor.obj.common.type === 'boolean') {
		const dim = pick((s) => ['level.dimmer', 'level.brightness'].includes(roleOf(s)) && s.obj.common.type === 'number' && isWritable(s));
		if (dim) related.brightness = dim.id;
	}
	const rgb = pick((s) => roleOf(s) === 'level.color.rgb' && s.obj.common.type === 'string' && isWritable(s));
	if (rgb) related.rgb = rgb.id;
	const hue = pick((s) => roleOf(s) === 'level.color.hue' && s.obj.common.type === 'number' && isWritable(s));
	const sat = pick((s) => roleOf(s) === 'level.color.saturation' && s.obj.common.type === 'number' && isWritable(s));
	if (hue && sat) {
		related.hue = hue.id;
		related.sat = sat.id;
	}
	const ct = pick((s) => roleOf(s) === 'level.color.temperature' && s.obj.common.type === 'number' && isWritable(s));
	if (ct) related.ct = ct.id;
	return related;
}

/** Related states of a media player: transport buttons, volume, metadata */
function mediaRelations(near, anchor) {
	const related = {};
	const find = (key, pred) => {
		const hit = near.find((s) => s.id !== anchor.id && pred(`${roleOf(s)} ${lastSegment(s.id)}`.toLowerCase(), s));
		if (hit) related[key] = hit.id;
	};
	const button = (s) => s.obj.common.type === 'boolean' && isWritable(s);
	find('play', (t, s) => button(s) && /(button|media)\.play\b|(^|\s|_)play$/.test(t.replace(/\s+/g, ' ')) && !/pause/.test(t));
	find('pause', (t, s) => button(s) && /(button|media)\.pause\b|(^|\s|_)pause$/.test(t));
	find('stop', (t, s) => button(s) && /(button|media)\.stop\b|(^|\s|_)stop$/.test(t));
	find('next', (t, s) => button(s) && /(button|media)\.next\b|(^|\s|_)next$/.test(t));
	find('prev', (t, s) => button(s) && /(button|media)\.(prev|previous)\b|(^|\s|_)(prev|previous)$/.test(t));
	find('volume', (t, s) => s.obj.common.type === 'number' && isWritable(s) && roleOf(s) === 'level.volume');
	find('title', (t, s) => roleOf(s) === 'media.title');
	find('artist', (t, s) => roleOf(s) === 'media.artist');
	find('cover', (t, s) => /^media\.cover/.test(roleOf(s)));
	return related;
}

/**
 * Build the entity registry: entity_id -> { id, obj, domain, related, relatedObjs, invert }
 * Some entities combine several states of the same channel: climate (setpoint + measured
 * temperature), cover (position + stop), light (switch + dimmer + colors) and
 * media_player (state + transport buttons + volume + metadata). The states that are
 * consumed this way do not show up a second time as separate entities.
 * @param {Array<{id: string, obj: object}>} list
 * @param {{invertCover?: boolean}} [options]
 */
function buildRegistry(list, options = {}) {
	const siblings = new Map();
	for (const item of list) {
		const parent = parentOf(item.id);
		if (!siblings.has(parent)) siblings.set(parent, []);
		siblings.get(parent).push(item);
	}
	const nearOf = (id) => siblings.get(parentOf(id)) || [];
	const byId = new Map(list.map((item) => [item.id, item]));

	// pass 1: entries and the sibling states they consume
	const entries = [];
	const consumed = new Set();
	for (const item of list) {
		const domain = domainOf(item.obj);
		if (!domain) continue;
		const near = nearOf(item.id);
		let related = {};

		if (domain === 'climate') {
			const measured =
				near.find((s) => roleOf(s) === 'value.temperature' && s.obj.common.type === 'number') ||
				near.find((s) => roleOf(s) === 'sensor.temperature' && s.obj.common.type === 'number');
			if (measured) related.current = measured.id;
		} else if (domain === 'cover') {
			const stop = near.find(
				(s) => s.obj.common.type === 'boolean' && isWritable(s) && /stop/i.test(`${roleOf(s)} ${lastSegment(s.id)}`)
			);
			if (stop) related.stop = stop.id;
		} else if (domain === 'light') {
			related = lightRelations(near, item);
			for (const id of Object.values(related)) consumed.add(id);
		} else if (domain === 'media_player') {
			related = mediaRelations(near, item);
			for (const id of Object.values(related)) consumed.add(id);
		}
		entries.push({ item, domain, related });
	}

	// pass 2: build the registry without the consumed states
	const registry = new Map();
	for (const { item, domain, related } of entries) {
		if (consumed.has(item.id)) continue;
		let entityId = `${domain}.${slug(item.id)}`;
		for (let i = 2; registry.has(entityId); i++) entityId = `${domain}.${slug(item.id)}_${i}`;
		const relatedObjs = Object.fromEntries(
			Object.entries(related).map(([key, id]) => [key, byId.get(id)?.obj])
		);
		registry.set(entityId, { id: item.id, obj: item.obj, domain, related, relatedObjs, invert: !!options.invertCover });
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
	} else if (entry.domain === 'media_player') {
		s = mediaState(value);
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
 * @param {(id: string) => any} [getValue] current value of any related state
 * @returns {{id: string, val: any}[] | undefined} undefined = unsupported service
 */
function serviceToWrites(entry, domain, service, data = {}, current, getValue) {
	const { id, obj, related } = entry;

	if (domain === 'switch') {
		if (service === 'turn_on') return [{ id, val: true }];
		if (service === 'turn_off') return [{ id, val: false }];
		if (service === 'toggle') return [{ id, val: !current }];
	}

	if (domain === 'light') return lightWrites(entry, service, data, current);

	if (domain === 'button' && (service === 'press' || service === 'turn_on')) return [{ id, val: true }];

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
		if (service === 'stop_cover' && related.stop) return [{ id: related.stop, val: true }];
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

	if (domain === 'media_player') return mediaWrites(entry, service, data, current, getValue);

	return undefined;
}

function lightWrites(entry, service, data, current) {
	const { id, obj, related, relatedObjs } = entry;
	const isNumber = obj.common.type === 'number';
	const dimId = isNumber ? id : related.brightness;
	const dimObj = isNumber ? obj : relatedObjs.brightness;
	const writes = [];

	const on = () => (isNumber ? undefined : { id, val: true });

	if (service === 'turn_off') return [isNumber ? { id, val: obj.common.min ?? 0 } : { id, val: false }];

	if (service === 'toggle') {
		const isOn = isNumber ? Number(current) > (obj.common.min ?? 0) : !!current;
		return lightWrites(entry, isOn ? 'turn_off' : 'turn_on', {}, current);
	}
	if (service !== 'turn_on') return undefined;

	const power = on();
	if (power) writes.push(power);

	if (dimId && (data.brightness !== undefined || data.brightness_pct !== undefined)) {
		const lo = dimObj.common.min ?? 0;
		const hi = dimObj.common.max ?? 100;
		const val =
			data.brightness !== undefined
				? fromBrightness(dimObj, data.brightness)
				: Math.round(lo + (data.brightness_pct / 100) * (hi - lo));
		writes.push({ id: dimId, val });
	} else if (isNumber) {
		writes.push({ id, val: obj.common.max ?? 100 });
	}

	if (data.rgb_color && related.rgb) writes.push({ id: related.rgb, val: rgbToHex(data.rgb_color) });
	if (data.hs_color && related.hue && related.sat) {
		writes.push({ id: related.hue, val: Math.round(data.hs_color[0]) }, { id: related.sat, val: Math.round(data.hs_color[1]) });
	}
	const kelvin = data.color_temp_kelvin ?? (data.kelvin !== undefined ? data.kelvin : undefined);
	if (kelvin !== undefined && related.ct) {
		const ctObj = relatedObjs.ct;
		let val = kelvinToCt(ctObj, kelvin);
		if (ctObj.common.min !== undefined && ctObj.common.max !== undefined) {
			val = Math.max(Math.min(ctObj.common.min, ctObj.common.max), Math.min(Math.max(ctObj.common.min, ctObj.common.max), val));
		}
		writes.push({ id: related.ct, val });
	}
	return writes;
}

function mediaWrites(entry, service, data, current, getValue) {
	const { id, obj, related, relatedObjs } = entry;
	const press = (key) => (related[key] ? [{ id: related[key], val: true }] : undefined);
	const state = mediaState(current);

	switch (service) {
		case 'media_play':
			return press('play') || (isWritableObj(obj) ? [{ id, val: typeof current === 'boolean' ? true : 'play' }] : undefined);
		case 'media_pause':
			return press('pause') || (isWritableObj(obj) ? [{ id, val: typeof current === 'boolean' ? false : 'pause' }] : undefined);
		case 'turn_on':
			return mediaWrites(entry, 'media_play', data, current, getValue);
		case 'turn_off':
			return press('stop') || mediaWrites(entry, 'media_pause', data, current, getValue);
		case 'media_stop':
			return press('stop');
		case 'toggle':
		case 'media_play_pause':
			return state === 'playing' ? mediaWrites(entry, 'media_pause', data, current, getValue) : mediaWrites(entry, 'media_play', data, current, getValue);
		case 'media_next_track':
			return press('next');
		case 'media_previous_track':
			return press('prev');
		case 'volume_set':
		case 'volume_up':
		case 'volume_down': {
			if (!related.volume) return undefined;
			const vo = relatedObjs.volume;
			const lo = vo.common.min ?? 0;
			const hi = vo.common.max ?? 100;
			let level;
			if (service === 'volume_set') {
				if (data.volume_level === undefined) return undefined;
				level = Number(data.volume_level);
			} else {
				const raw = getValue?.(related.volume);
				const now = typeof raw === 'number' && hi !== lo ? (raw - lo) / (hi - lo) : 0;
				level = now + (service === 'volume_up' ? 0.05 : -0.05);
			}
			level = Math.max(0, Math.min(1, level));
			return [{ id: related.volume, val: Math.round(lo + level * (hi - lo)) }];
		}
		default:
			return undefined;
	}
}
const isWritableObj = (obj) => obj.common.write !== false;

module.exports = {
	nameOf,
	slug,
	domainOf,
	buildRegistry,
	sourceIds,
	compressedEntity,
	serviceToWrites,
	stateString,
	hexToRgb,
	rgbToHex,
	mediaState,
	toBrightness,
	fromBrightness,
	toPosition,
	fromPosition
};
