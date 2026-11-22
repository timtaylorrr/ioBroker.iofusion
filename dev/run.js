'use strict';

/**
 * Runs bridge + web server against an in-memory fake ioBroker, so the
 * adapter can be developed without a js-controller.   npm run dev
 */
const path = require('node:path');
const { Bridge } = require('../lib/bridge');
const { startServer } = require('../lib/server');
const { ensureDataDir } = require('../lib/data');
const { buildDashboard, hasViews, writeDashboard } = require('../lib/dashboard');
const { createAuth } = require('../lib/auth');

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
// more devices in a realistic tree, to try the grouped entity picker
Object.assign(objects, {
	'hm-rpc.0.NEQ1001.1.STATE': obj('Flur Licht', 'switch.light', 'boolean'),
	'hm-rpc.0.NEQ1001.2.STATE': obj('Flur Spiegel', 'switch.light', 'boolean'),
	'hm-rpc.0.NEQ2002.1.TEMPERATURE': obj('Bad Temperatur', 'value.temperature', 'number', { write: false, unit: '°C' }),
	'hm-rpc.0.NEQ2002.1.HUMIDITY': obj('Bad Feuchte', 'value.humidity', 'number', { write: false, unit: '%' }),
	'zigbee.0.00158d0001.state': obj('Schlafzimmer Lampe', 'switch.light', 'boolean'),
	'zigbee.0.00158d0001.brightness': obj('Schlafzimmer Helligkeit', 'level.dimmer', 'number', { min: 0, max: 254 }),
	'zigbee.0.00158d0002.temperature': obj('Garten Temperatur', 'value.temperature', 'number', { write: false, unit: '°C' }),
	'zigbee.0.00158d0002.battery': obj('Garten Batterie', 'value.battery', 'number', { write: false, unit: '%' }),
	'shelly.0.shellyplug#AB12.Relay0.Switch': obj('Waschmaschine', 'switch', 'boolean'),
	'shelly.0.shellyplug#AB12.Relay0.Power': obj('Waschmaschine Leistung', 'value.power', 'number', { write: false, unit: 'W' }),
	// thermostat: setpoint + measured value in the same channel
	'hm-rpc.0.THERMO1.1.SET_POINT': obj('Wohnzimmer Heizung', 'level.temperature', 'number', { min: 6, max: 30, unit: '°C' }),
	'hm-rpc.0.THERMO1.1.ACTUAL_TEMPERATURE': obj('Wohnzimmer Ist-Temperatur', 'value.temperature', 'number', { write: false, unit: '°C' }),
	// blinds: position + stop button
	'hm-rpc.0.BLIND1.1.LEVEL': obj('Wohnzimmer Rollladen', 'level.blind', 'number', { min: 0, max: 100, unit: '%' }),
	'hm-rpc.0.BLIND1.1.STOP': obj('Wohnzimmer Rollladen Stopp', 'button.stop', 'boolean'),
	'hm-rpc.0.BLIND2.1.LEVEL': obj('Schlafzimmer Rollladen', 'level.blind', 'number', { min: 0, max: 100, unit: '%' })
});
const values = {
	'0_userdata.0.wohnzimmer.licht': true,
	'0_userdata.0.wohnzimmer.dimmer': 40,
	'0_userdata.0.kueche.steckdose': false,
	'0_userdata.0.wohnzimmer.temperatur': 21.4,
	'0_userdata.0.wohnzimmer.feuchte': 48,
	'0_userdata.0.flur.bewegung': false,
	'0_userdata.0.haustuer.offen': false,
	'hm-rpc.0.NEQ1001.1.STATE': false,
	'hm-rpc.0.NEQ1001.2.STATE': true,
	'hm-rpc.0.NEQ2002.1.TEMPERATURE': 23.1,
	'hm-rpc.0.NEQ2002.1.HUMIDITY': 61,
	'zigbee.0.00158d0001.state': false,
	'zigbee.0.00158d0001.brightness': 0,
	'zigbee.0.00158d0002.temperature': 11.5,
	'zigbee.0.00158d0002.battery': 87,
	'shelly.0.shellyplug#AB12.Relay0.Switch': true,
	'shelly.0.shellyplug#AB12.Relay0.Power': 412,
	'hm-rpc.0.THERMO1.1.SET_POINT': 21,
	'hm-rpc.0.THERMO1.1.ACTUAL_TEMPERATURE': 20.4,
	'hm-rpc.0.BLIND1.1.LEVEL': 100,
	'hm-rpc.0.BLIND1.1.STOP': false,
	'hm-rpc.0.BLIND2.1.LEVEL': 35
};

const callbacks = [];
const stateOf = (val) => ({ val, ack: true, ts: Date.now(), lc: Date.now() });
const emit = (id, val) => {
	values[id] = val;
	callbacks.forEach((cb) => cb(id, stateOf(val)));
};

const rooms = [
	{ id: 'enum.rooms.wohnzimmer', name: 'Wohnzimmer', members: ['0_userdata.0.wohnzimmer', 'hm-rpc.0.THERMO1.1', 'hm-rpc.0.BLIND1.1'] },
	{ id: 'enum.rooms.kueche', name: 'Küche', members: ['0_userdata.0.kueche'] },
	{ id: 'enum.rooms.flur', name: 'Flur', members: ['0_userdata.0.flur', '0_userdata.0.haustuer', 'hm-rpc.0.NEQ1001'] },
	{ id: 'enum.rooms.bad', name: 'Bad', members: ['hm-rpc.0.NEQ2002'] },
	{ id: 'enum.rooms.schlafzimmer', name: 'Schlafzimmer', members: ['zigbee.0.00158d0001', 'hm-rpc.0.BLIND2'] },
	{ id: 'enum.rooms.garten', name: 'Garten', members: ['zigbee.0.00158d0002'] }
];

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
	if (!hasViews(dataDir)) writeDashboard(dataDir, buildDashboard({ registry: bridge.registry, rooms, lang: 'de' }));
	// DEV_AUTH=user:password turns the login on
	const [user, pass] = String(process.env.DEV_AUTH || '').split(':');
	const auth = createAuth({ enabled: !!process.env.DEV_AUTH, username: user, password: pass, dataDir, lang: 'de' });
	await startServer({ auth, port: Number(process.env.PORT) || 8095, bind: '127.0.0.1', dataDir, token, bridge });

	// simulate a live sensor
	setInterval(() => {
		emit('0_userdata.0.wohnzimmer.temperatur', Math.round((20 + Math.random() * 3) * 10) / 10);
	}, 5000);
})();
