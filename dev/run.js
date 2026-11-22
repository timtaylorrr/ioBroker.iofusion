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
const { pickGraphEntities } = require('../lib/history');

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
	// light with switch + brightness + color in one channel (becomes ONE entity)
	'zigbee.0.00158d0001.color': obj('Schlafzimmer Farbe', 'level.color.rgb', 'string'),
	'zigbee.0.00158d0001.colortemp': obj('Schlafzimmer Farbtemperatur', 'level.color.temperature', 'number', { min: 153, max: 500, unit: 'mired' }),
	// media player (sonos style)
	'sonos.0.root.WZ.state': obj('Wohnzimmer Sonos', 'media.state', 'string'),
	'sonos.0.root.WZ.play': obj('Play', 'button.play', 'boolean'),
	'sonos.0.root.WZ.pause': obj('Pause', 'button.pause', 'boolean'),
	'sonos.0.root.WZ.next': obj('Next', 'button.next', 'boolean'),
	'sonos.0.root.WZ.prev': obj('Prev', 'button.prev', 'boolean'),
	'sonos.0.root.WZ.volume': obj('Volume', 'level.volume', 'number', { min: 0, max: 100 }),
	'sonos.0.root.WZ.current_title': obj('Titel', 'media.title', 'string', { write: false }),
	'sonos.0.root.WZ.current_artist': obj('Künstler', 'media.artist', 'string', { write: false }),
	// indicators
	'zigbee.0.00158d0002.lowbat': obj('Garten Batterie schwach', 'indicator.maintenance.lowbat', 'boolean', { write: false }),
	'zigbee.0.00158d0002.available': obj('Garten erreichbar', 'indicator.reachable', 'boolean', { write: false }),
	// thermostat: setpoint + measured value in the same channel
	'hm-rpc.0.THERMO1.1.SET_POINT': obj('Wohnzimmer Heizung', 'level.temperature', 'number', { min: 6, max: 30, unit: '°C' }),
	'hm-rpc.0.THERMO1.1.ACTUAL_TEMPERATURE': obj('Wohnzimmer Ist-Temperatur', 'value.temperature', 'number', { write: false, unit: '°C' }),
	// blinds: position + stop button
	'hm-rpc.0.BLIND1.1.LEVEL': obj('Wohnzimmer Rollladen', 'level.blind', 'number', { min: 0, max: 100, unit: '%' }),
	'hm-rpc.0.BLIND1.1.STOP': obj('Wohnzimmer Rollladen Stopp', 'button.stop', 'boolean'),
	'hm-rpc.0.BLIND2.1.LEVEL': obj('Schlafzimmer Rollladen', 'level.blind', 'number', { min: 0, max: 100, unit: '%' })
});
// MOCK_BIG=1 adds ~3000 KNX style states (knx.0.<Funktion>.<Etage>.<Name>) to try big installations
const bigValues = {};
if (process.env.MOCK_BIG) {
	const functions = [['Licht_schalten', 'switch.light', 'boolean', false], ['Steckdose_schalten', 'switch', 'boolean', false], ['Licht_dimmen', 'level.dimmer', 'number', false], ['Jalousie_Position', 'level.blind', 'number', false], ['Temperatur_Ist', 'value.temperature', 'number', true], ['Fenster_Status', 'sensor.window', 'boolean', true]];
	const floors = ['UG', 'EG', 'OG', 'DG'];
	const names = ['Küche', 'Wohnzimmer', 'Esszimmer', 'Flur', 'Bad', 'Gäste_WC', 'Büro', 'Schlafzimmer', 'Kinderzimmer', 'Garage', 'Terrasse', 'Keller', 'Hauswirtschaft', 'Treppe', 'Gartenhaus'];
	for (const [fn, role, type, readOnly] of functions) {
		for (const floor of floors) {
			for (let i = 0; i < 125; i++) {
				const name = `${names[i % names.length]}_${Math.floor(i / names.length) + 1}`;
				const id = `knx.0.${fn}.${floor}.${fn.split('_')[0]}_${floor}_${name}`;
				objects[id] = obj(`${fn.split('_')[0]} ${floor} ${name.replace(/_/g, ' ')}`, role, type, { write: !readOnly, ...(type === 'number' ? { min: 0, max: 100 } : {}) });
				bigValues[id] = type === 'boolean' ? false : 0;
			}
		}
	}
}

// history is enabled for these states in the fake history.0 instance
for (const id of ['0_userdata.0.wohnzimmer.temperatur', '0_userdata.0.wohnzimmer.feuchte', 'hm-rpc.0.NEQ2002.1.TEMPERATURE', 'zigbee.0.00158d0002.temperature', 'shelly.0.shellyplug#AB12.Relay0.Power']) {
	objects[id].common.custom = { 'history.0': { enabled: true } };
}
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
	'zigbee.0.00158d0001.color': '#ff8a3d',
	'zigbee.0.00158d0001.colortemp': 370,
	'sonos.0.root.WZ.state': 'play',
	'sonos.0.root.WZ.play': false,
	'sonos.0.root.WZ.pause': false,
	'sonos.0.root.WZ.next': false,
	'sonos.0.root.WZ.prev': false,
	'sonos.0.root.WZ.volume': 30,
	'sonos.0.root.WZ.current_title': 'Weightless',
	'sonos.0.root.WZ.current_artist': 'Marconi Union',
	'zigbee.0.00158d0002.lowbat': false,
	'zigbee.0.00158d0002.available': true,
	'hm-rpc.0.THERMO1.1.SET_POINT': 21,
	'hm-rpc.0.THERMO1.1.ACTUAL_TEMPERATURE': 20.4,
	'hm-rpc.0.BLIND1.1.LEVEL': 100,
	'hm-rpc.0.BLIND1.1.STOP': false,
	'hm-rpc.0.BLIND2.1.LEVEL': 35
};
Object.assign(values, bigValues);

const callbacks = [];
const stateOf = (val) => ({ val, ack: true, ts: Date.now(), lc: Date.now() });
const emit = (id, val) => {
	values[id] = val;
	callbacks.forEach((cb) => cb(id, stateOf(val)));
};

const rooms = [
	{ id: 'enum.rooms.wohnzimmer', name: 'Wohnzimmer', members: ['0_userdata.0.wohnzimmer', 'hm-rpc.0.THERMO1.1', 'hm-rpc.0.BLIND1.1', 'sonos.0.root.WZ'] },
	{ id: 'enum.rooms.kueche', name: 'Küche', members: ['0_userdata.0.kueche'] },
	{ id: 'enum.rooms.flur', name: 'Flur', members: ['0_userdata.0.flur', '0_userdata.0.haustuer', 'hm-rpc.0.NEQ1001'] },
	{ id: 'enum.rooms.bad', name: 'Bad', members: ['hm-rpc.0.NEQ2002'] },
	{ id: 'enum.rooms.schlafzimmer', name: 'Schlafzimmer', members: ['zigbee.0.00158d0001', 'hm-rpc.0.BLIND2'] },
	{ id: 'enum.rooms.garten', name: 'Garten', members: ['zigbee.0.00158d0002'] }
];

// synthetic recordings: a daily sine wave around the current value
const fakeHistory = async (id, { start, end, step, aggregate }) => {
	const base = Number(values[id]) || 20;
	const rows = [];
	if (aggregate === 'onchange') return rows;
	for (let ts = Math.ceil(start / step) * step; ts < end; ts += step) {
		const day = (ts % 86400000) / 86400000;
		rows.push({ ts, val: base + Math.sin(day * 2 * Math.PI - 1.6) * (base * 0.12) + Math.sin(ts / 3.7e6) * (base * 0.02) });
	}
	return rows;
};

const iob = {
	historyInstance: 'history.0',
	history: fakeHistory,
	list: async () => Object.entries(objects).map(([id, o]) => ({ id, obj: o, state: stateOf(values[id]) })),
	setState: async (id, val) => {
		console.log('[mock] setState', id, val);
		emit(id, val);
		// like a real player: transport buttons change the media state
		if (id.startsWith('sonos.0.root.WZ.') && val === true) {
			const next = { play: 'play', pause: 'pause' }[id.split('.').pop()];
			if (next) emit('sonos.0.root.WZ.state', next);
		}
	},
	onStateChange: (cb) => callbacks.push(cb)
};

(async () => {
	const token = 'dev-token';
	const bridge = new Bridge(iob, { token, config: { language: 'de' } });
	await bridge.init();
	const dataDir = path.join(__dirname, '.data');
	ensureDataDir(dataDir);
	if (!hasViews(dataDir)) writeDashboard(dataDir, buildDashboard({ registry: bridge.registry, rooms, lang: 'de', graphEntityIds: pickGraphEntities(bridge.registry, 'history.0') }));
	// DEV_AUTH=user:password turns the login on
	const [user, pass] = String(process.env.DEV_AUTH || '').split(':');
	const auth = createAuth({ enabled: !!process.env.DEV_AUTH, username: user, password: pass, dataDir, lang: 'de' });
	await startServer({ auth, port: Number(process.env.PORT) || 8095, bind: '127.0.0.1', dataDir, token, bridge });

	// simulate a battery that runs low after a while
	setTimeout(() => emit('zigbee.0.00158d0002.battery', 12), 12000);

	// simulate a live sensor
	setInterval(() => {
		emit('0_userdata.0.wohnzimmer.temperatur', Math.round((20 + Math.random() * 3) * 10) / 10);
	}, 5000);
})();
