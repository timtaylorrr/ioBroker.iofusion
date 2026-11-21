'use strict';

/**
 * Runs bridge + web server against an in-memory fake ioBroker, so the
 * adapter can be developed without a js-controller.   npm run dev
 */
const path = require('node:path');
const { Bridge } = require('../lib/bridge');
const { startServer } = require('../lib/server');
const { ensureDataDir } = require('../lib/data');

const obj = (name, role, type, extra = {}) => ({
	type: 'state',
	common: { name, role, type, read: true, write: true, ...extra },
	native: {}
});

const objects = {
	'0_userdata.0.wohnzimmer.licht': obj('Wohnzimmer Licht', 'switch.light', 'boolean'),
	'0_userdata.0.wohnzimmer.dimmer': obj('Wohnzimmer Dimmer', 'level.dimmer', 'number', { min: 0, max: 100, unit: '%' }),
	'0_userdata.0.kueche.steckdose': obj('Küche Steckdose', 'switch', 'boolean'),
	'0_userdata.0.wohnzimmer.temperatur': obj({ de: 'Wohnzimmer Temperatur', en: 'Living room temperature' }, 'value.temperature', 'number', { write: false, unit: '°C' }),
	'0_userdata.0.wohnzimmer.feuchte': obj('Wohnzimmer Feuchte', 'value.humidity', 'number', { write: false, unit: '%' }),
	'0_userdata.0.flur.bewegung': obj('Flur Bewegung', 'sensor.motion', 'boolean', { write: false }),
	'0_userdata.0.haustuer.offen': obj('Haustür', 'sensor.door', 'boolean', { write: false })
};
const values = {
	'0_userdata.0.wohnzimmer.licht': true,
	'0_userdata.0.wohnzimmer.dimmer': 40,
	'0_userdata.0.kueche.steckdose': false,
	'0_userdata.0.wohnzimmer.temperatur': 21.4,
	'0_userdata.0.wohnzimmer.feuchte': 48,
	'0_userdata.0.flur.bewegung': false,
	'0_userdata.0.haustuer.offen': false
};

const callbacks = [];
const stateOf = (val) => ({ val, ack: true, ts: Date.now(), lc: Date.now() });
const emit = (id, val) => {
	values[id] = val;
	callbacks.forEach((cb) => cb(id, stateOf(val)));
};

const iob = {
	list: async () => Object.entries(objects).map(([id, o]) => ({ id, obj: o, state: stateOf(values[id]) })),
	setState: async (id, val) => {
		console.log('[mock] setState', id, val);
		emit(id, val);
	},
	onStateChange: (cb) => callbacks.push(cb)
};

(async () => {
	const token = 'dev-token';
	const bridge = new Bridge(iob, { token, config: { language: 'de' } });
	await bridge.init();
	const dataDir = path.join(__dirname, '.data');
	ensureDataDir(dataDir);
	await startServer({ port: Number(process.env.PORT) || 8095, bind: '127.0.0.1', dataDir, token, bridge });

	// simulate a live sensor
	setInterval(() => {
		emit('0_userdata.0.wohnzimmer.temperatur', Math.round((20 + Math.random() * 3) * 10) / 10);
	}, 5000);
})();
