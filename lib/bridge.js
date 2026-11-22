'use strict';

const { WebSocketServer } = require('ws');
const { buildRegistry, sourceIds, compressedEntity, serviceToWrites } = require('./entities');
const { listStatisticIds, statisticsDuringPeriod, historyStream } = require('./history');

const HA_VERSION = '2025.1.0';

/**
 * Speaks the subset of the Home Assistant WebSocket API that the ha-fusion
 * frontend needs, backed by an ioBroker data source.
 *
 * @typedef {object} Iob
 * @property {() => Promise<Array<{id: string, obj: object, state: object|null}>>} list
 * @property {(id: string, val: any) => Promise<void>} setState
 * @property {(cb: (id: string, state: object|null) => void) => void} onStateChange
 */
class Bridge {
	/**
	 * @param {Iob} iob
	 * @param {{token: string, log?: object, config?: object}} options
	 */
	constructor(iob, options) {
		this.iob = iob;
		this.token = options.token;
		this.log = options.log || console;
		this.haConfig = options.config || {};
		this.registry = new Map(); // entity_id -> { id, obj, domain }
		this.byIobId = new Map(); // iobroker id -> entity_id[] (a state can feed several entities)
		this.invertCover = !!options.invertCover;
		this.getState = (id) => this.states.get(id);
		this.states = new Map(); // iobroker id -> state
		this.clients = new Set();
		this.wss = new WebSocketServer({ noServer: true });
		this.wss.on('connection', (ws) => this.onConnection(ws));
	}

	async init() {
		const list = await this.iob.list();
		this.registry = buildRegistry(list, { invertCover: this.invertCover });
		this.byIobId.clear();
		for (const [entityId, entry] of this.registry) {
			for (const iobId of sourceIds(entry)) {
				if (!this.byIobId.has(iobId)) this.byIobId.set(iobId, []);
				this.byIobId.get(iobId).push(entityId);
			}
		}
		for (const { id, state } of list) if (this.byIobId.has(id)) this.states.set(id, state);
		this.iob.onStateChange((id, state) => this.onIobState(id, state));
		this.log.info?.(`ioFusion: ${this.registry.size} entities exposed`);
	}

	/** Called by the http server for `Upgrade` requests on /api/websocket */
	handleUpgrade(req, socket, head) {
		this.wss.handleUpgrade(req, socket, head, (ws) => this.wss.emit('connection', ws, req));
	}

	close() {
		for (const client of this.clients) client.ws.terminate();
		this.wss.close();
	}

	// ---------- ioBroker -> clients ----------

	onIobState(id, state) {
		const entityIds = this.byIobId.get(id);
		if (!entityIds) return;
		this.states.set(id, state);
		const a = {};
		for (const entityId of entityIds) {
			const entry = this.registry.get(entityId);
			a[entityId] = compressedEntity(entry, this.states.get(entry.id), this.getState);
		}
		for (const client of this.clients) {
			for (const subId of client.entitySubs) {
				this.send(client.ws, { id: subId, type: 'event', event: { a } });
			}
		}
	}

	allEntities() {
		const a = {};
		for (const [entityId, entry] of this.registry) {
			a[entityId] = compressedEntity(entry, this.states.get(entry.id), this.getState);
		}
		return a;
	}

	// ---------- clients ----------

	send(ws, message) {
		if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
	}

	onConnection(ws) {
		const client = { ws, authed: false, entitySubs: new Set() };
		this.clients.add(client);
		this.send(ws, { type: 'auth_required', ha_version: HA_VERSION });

		ws.on('message', async (raw) => {
			let msg;
			try {
				msg = JSON.parse(raw.toString());
			} catch {
				return ws.close();
			}
			try {
				await this.onMessage(client, msg);
			} catch (error) {
				this.log.error?.(`ioFusion: ${error?.stack || error}`);
				if (msg?.id !== undefined) this.fail(client, msg.id, 'home_assistant_error', String(error?.message || error));
			}
		});
		ws.on('close', () => this.clients.delete(client));
		ws.on('error', () => this.clients.delete(client));
	}

	ok(client, id, result = null) {
		this.send(client.ws, { id, type: 'result', success: true, result });
	}

	fail(client, id, code, message) {
		this.send(client.ws, { id, type: 'result', success: false, error: { code, message } });
	}

	async onMessage(client, msg) {
		if (!client.authed) {
			if (msg.type === 'auth' && msg.access_token === this.token) {
				client.authed = true;
				return this.send(client.ws, { type: 'auth_ok', ha_version: HA_VERSION });
			}
			this.send(client.ws, { type: 'auth_invalid', message: 'Invalid access token' });
			return client.ws.close();
		}

		const { id } = msg;
		switch (msg.type) {
			case 'ping':
				return this.send(client.ws, { id, type: 'pong' });

			case 'supported_features':
				return this.ok(client, id);

			case 'subscribe_entities':
				client.entitySubs.add(id);
				this.ok(client, id);
				return this.send(client.ws, { id, type: 'event', event: { a: this.allEntities() } });

			case 'unsubscribe_events':
				client.entitySubs.delete(msg.subscription);
				return this.ok(client, id);

			case 'get_states':
				return this.ok(
					client,
					id,
					Object.entries(this.allEntities()).map(([entity_id, e]) => ({
						entity_id,
						state: e.s,
						attributes: e.a,
						last_changed: new Date(e.lc * 1000).toISOString(),
						last_updated: new Date(e.lu * 1000).toISOString(),
						context: { id: e.c, parent_id: null, user_id: null }
					}))
				);

			case 'get_config':
				return this.ok(client, id, this.config());

			case 'get_services':
				return this.ok(client, id, this.services());

			case 'call_service':
				return this.callService(client, msg);

			// subscriptions we accept but never fire (keeps the UI happy)
			case 'recorder/list_statistic_ids':
				return this.ok(client, id, listStatisticIds(this.registry, this.iob.historyInstance));

			case 'recorder/validate_statistics':
				return this.ok(client, id, {});

			case 'recorder/statistics_during_period':
				return this.ok(client, id, await statisticsDuringPeriod(this.iob, this.registry, msg));

			case 'history/stream': {
				const data = await historyStream(this.iob, this.registry, this.states, msg);
				this.ok(client, id);
				return this.send(client.ws, { id, type: 'event', event: data });
			}

			case 'frontend/get_user_data':
				return this.ok(client, id, { value: null });

			case 'frontend/set_user_data':
				return this.ok(client, id);

			case 'subscribe_events':
			case 'subscribe_trigger':
				return this.ok(client, id);

			case 'persistent_notification/subscribe':
				this.ok(client, id);
				return this.send(client.ws, { id, type: 'event', event: { type: 'current', notifications: {} } });

			default:
				return this.fail(client, id, 'unknown_command', `Unsupported command: ${msg.type}`);
		}
	}

	async callService(client, msg) {
		const { id, domain, service } = msg;
		const data = { ...(msg.service_data || {}) };
		const target = msg.target || {};
		let entityIds = data.entity_id ?? target.entity_id ?? [];
		if (!Array.isArray(entityIds)) entityIds = [entityIds];

		const writes = [];
		for (const entityId of entityIds) {
			const entry = this.registry.get(entityId);
			if (!entry) return this.fail(client, id, 'not_found', `Unknown entity ${entityId}`);
			const current = this.states.get(entry.id)?.val;
			const result = serviceToWrites(entry, domain, service, data, current, (iobId) => this.states.get(iobId)?.val);
			if (!result) return this.fail(client, id, 'service_not_found', `${domain}.${service} is not supported`);
			writes.push(...result);
		}
		for (const w of writes) await this.iob.setState(w.id, w.val);
		this.ok(client, id, { context: { id: `iofusion-${Date.now()}`, parent_id: null, user_id: null } });
	}

	config() {
		return {
			latitude: this.haConfig.latitude ?? 0,
			longitude: this.haConfig.longitude ?? 0,
			elevation: 0,
			radius: 100,
			unit_system: { length: 'km', mass: 'g', temperature: '°C', volume: 'L', pressure: 'hPa', wind_speed: 'km/h', accumulated_precipitation: 'mm' },
			location_name: 'ioBroker',
			time_zone: this.haConfig.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
			language: this.haConfig.language || 'de',
			currency: 'EUR',
			country: null,
			config_dir: '/',
			allowlist_external_dirs: [],
			allowlist_external_urls: [],
			components: ['light', 'switch', 'sensor', 'binary_sensor', 'button', 'climate', 'cover', 'media_player', 'websocket_api'],
			version: HA_VERSION,
			state: 'RUNNING',
			safe_mode: false,
			recovery_mode: false,
			external_url: null,
			internal_url: null
		};
	}

	services() {
		const svc = (...names) => Object.fromEntries(names.map((n) => [n, { name: n, description: '', fields: {} }]));
		return {
			switch: svc('turn_on', 'turn_off', 'toggle'),
			light: svc('turn_on', 'turn_off', 'toggle'),
			button: svc('press'),
			climate: svc('set_temperature', 'set_hvac_mode'),
			media_player: svc('toggle', 'turn_on', 'turn_off', 'media_play', 'media_pause', 'media_stop', 'media_play_pause', 'media_next_track', 'media_previous_track', 'volume_set', 'volume_up', 'volume_down'),
			cover: svc('open_cover', 'close_cover', 'stop_cover', 'set_cover_position', 'toggle')
		};
	}
}

module.exports = { Bridge, HA_VERSION };
