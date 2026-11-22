'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { buildRegistry, compressedEntity, serviceToWrites, hexToRgb, rgbToHex, mediaState } = require('../lib/entities');

const st = (name, role, type, extra = {}) => ({ type: 'state', common: { name, role, type, write: true, ...extra } });

const lightList = [
	{ id: 'z.0.L.state', obj: st('Lampe', 'switch.light', 'boolean') },
	{ id: 'z.0.L.brightness', obj: st('Helligkeit', 'level.dimmer', 'number', { min: 0, max: 254 }) },
	{ id: 'z.0.L.color', obj: st('Farbe', 'level.color.rgb', 'string') },
	{ id: 'z.0.L.ct', obj: st('CT', 'level.color.temperature', 'number', { min: 153, max: 500, unit: 'mired' }) }
];

test('switch, dimmer and colors of one channel form a single light', () => {
	const reg = buildRegistry(lightList);
	assert.deepStrictEqual([...reg.keys()], ['light.z_0_l_state']);
	const entry = reg.get('light.z_0_l_state');
	const values = { 'z.0.L.brightness': { val: 127 }, 'z.0.L.color': { val: '#ff0000' }, 'z.0.L.ct': { val: 250 } };
	const e = compressedEntity(entry, { val: true }, (id) => values[id]);
	assert.strictEqual(e.s, 'on');
	assert.strictEqual(e.a.brightness, 128);
	assert.deepStrictEqual(e.a.supported_color_modes, ['rgb', 'color_temp']);
	assert.deepStrictEqual(e.a.rgb_color, [255, 0, 0]);
	assert.strictEqual(e.a.color_temp_kelvin, 4000); // 250 mired
	assert.strictEqual(e.a.min_color_temp_kelvin, 2000);
	assert.strictEqual(e.a.max_color_temp_kelvin, 6536);
});

test('light services write the right states', () => {
	const entry = buildRegistry(lightList).get('light.z_0_l_state');
	assert.deepStrictEqual(serviceToWrites(entry, 'light', 'turn_on', {}), [{ id: 'z.0.L.state', val: true }]);
	assert.deepStrictEqual(serviceToWrites(entry, 'light', 'turn_off'), [{ id: 'z.0.L.state', val: false }]);
	assert.deepStrictEqual(serviceToWrites(entry, 'light', 'turn_on', { brightness: 255, rgb_color: [0, 128, 255], color_temp_kelvin: 2500 }), [
		{ id: 'z.0.L.state', val: true },
		{ id: 'z.0.L.brightness', val: 254 },
		{ id: 'z.0.L.color', val: '#0080ff' },
		{ id: 'z.0.L.ct', val: 400 }
	]);
	assert.deepStrictEqual(serviceToWrites(entry, 'light', 'toggle', {}, true), [{ id: 'z.0.L.state', val: false }]);
});

test('a lone dimmer stays a light without a separate switch', () => {
	const entry = buildRegistry([{ id: 'x.0.D', obj: st('D', 'level.dimmer', 'number', { min: 0, max: 100 }) }]).get('light.x_0_d');
	assert.deepStrictEqual(serviceToWrites(entry, 'light', 'turn_on', { brightness_pct: 50 }), [{ id: 'x.0.D', val: 50 }]);
});

test('color helpers', () => {
	assert.deepStrictEqual(hexToRgb('#0a0b0c'), [10, 11, 12]);
	assert.strictEqual(hexToRgb('nope'), undefined);
	assert.strictEqual(rgbToHex([300, -5, 16]), '#ff0010');
});

const mediaList = [
	{ id: 's.0.WZ.state', obj: st('Sonos', 'media.state', 'string') },
	{ id: 's.0.WZ.play', obj: st('Play', 'button.play', 'boolean') },
	{ id: 's.0.WZ.pause', obj: st('Pause', 'button.pause', 'boolean') },
	{ id: 's.0.WZ.next', obj: st('Next', 'button.next', 'boolean') },
	{ id: 's.0.WZ.volume', obj: st('Vol', 'level.volume', 'number', { min: 0, max: 100 }) },
	{ id: 's.0.WZ.title', obj: st('T', 'media.title', 'string', { write: false }) },
	{ id: 's.0.WZ.cover', obj: st('C', 'media.cover', 'string', { write: false }) }
];

test('media player collects transport, volume and metadata and hides the helper states', () => {
	const reg = buildRegistry(mediaList);
	assert.deepStrictEqual([...reg.keys()], ['media_player.s_0_wz_state']);
	const entry = reg.get('media_player.s_0_wz_state');
	const values = { 's.0.WZ.volume': { val: 30 }, 's.0.WZ.title': { val: 'Song' }, 's.0.WZ.cover': { val: 'http://x/c.jpg' } };
	const e = compressedEntity(entry, { val: 'play' }, (id) => values[id]);
	assert.strictEqual(e.s, 'playing');
	assert.strictEqual(e.a.media_title, 'Song');
	assert.strictEqual(e.a.entity_picture, 'http://x/c.jpg');
	assert.strictEqual(e.a.volume_level, 0.3);
	// PLAY | PAUSE | NEXT | VOLUME_SET | VOLUME_STEP, no PREVIOUS/STOP
	assert.strictEqual(e.a.supported_features, 16384 | 1 | 32 | 4 | 1024);
});

test('media player services', () => {
	const entry = buildRegistry(mediaList).get('media_player.s_0_wz_state');
	const vol = (id) => (id === 's.0.WZ.volume' ? 30 : undefined);
	assert.deepStrictEqual(serviceToWrites(entry, 'media_player', 'media_pause', {}, 'play', vol), [{ id: 's.0.WZ.pause', val: true }]);
	assert.deepStrictEqual(serviceToWrites(entry, 'media_player', 'media_next_track', {}, 'play', vol), [{ id: 's.0.WZ.next', val: true }]);
	assert.strictEqual(serviceToWrites(entry, 'media_player', 'media_previous_track', {}, 'play', vol), undefined);
	assert.deepStrictEqual(serviceToWrites(entry, 'media_player', 'volume_set', { volume_level: 0.5 }, 'play', vol), [{ id: 's.0.WZ.volume', val: 50 }]);
	assert.deepStrictEqual(serviceToWrites(entry, 'media_player', 'volume_up', {}, 'play', vol), [{ id: 's.0.WZ.volume', val: 35 }]);
	assert.deepStrictEqual(serviceToWrites(entry, 'media_player', 'volume_down', {}, 'play', () => 2), [{ id: 's.0.WZ.volume', val: 0 }]);
	assert.deepStrictEqual(serviceToWrites(entry, 'media_player', 'media_play_pause', {}, 'play', vol), [{ id: 's.0.WZ.pause', val: true }]);
	assert.deepStrictEqual(serviceToWrites(entry, 'media_player', 'media_play_pause', {}, 'pause', vol), [{ id: 's.0.WZ.play', val: true }]);
});

test('media toggle, turn_on and turn_off', () => {
	const entry = buildRegistry(mediaList).get('media_player.s_0_wz_state');
	assert.deepStrictEqual(serviceToWrites(entry, 'media_player', 'toggle', {}, 'play'), [{ id: 's.0.WZ.pause', val: true }]);
	assert.deepStrictEqual(serviceToWrites(entry, 'media_player', 'toggle', {}, 'pause'), [{ id: 's.0.WZ.play', val: true }]);
	assert.deepStrictEqual(serviceToWrites(entry, 'media_player', 'turn_on', {}, 'idle'), [{ id: 's.0.WZ.play', val: true }]);
	// no stop button: turn_off pauses
	assert.deepStrictEqual(serviceToWrites(entry, 'media_player', 'turn_off', {}, 'play'), [{ id: 's.0.WZ.pause', val: true }]);
});

test('media state mapping', () => {
	assert.deepStrictEqual(['play', 'Paused', 'stop', true, false, 1, 2, 0, null].map(mediaState), [
		'playing', 'paused', 'idle', 'playing', 'paused', 'playing', 'paused', 'idle', 'unknown'
	]);
});

test('indicators become binary sensors with device class', () => {
	const reg = buildRegistry([
		{ id: 'z.0.A.lowbat', obj: st('LB', 'indicator.maintenance.lowbat', 'boolean', { write: false }) },
		{ id: 'z.0.A.reach', obj: st('R', 'indicator.reachable', 'boolean', { write: false }) }
	]);
	assert.strictEqual(compressedEntity(reg.get('binary_sensor.z_0_a_lowbat'), { val: true }).a.device_class, 'battery');
	assert.strictEqual(compressedEntity(reg.get('binary_sensor.z_0_a_reach'), { val: true }).a.device_class, 'connectivity');
});
