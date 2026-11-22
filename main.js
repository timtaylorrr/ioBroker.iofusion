'use strict';

const path = require('node:path');
const utils = require('@iobroker/adapter-core');
const { Bridge } = require('./lib/bridge');
const { startServer } = require('./lib/server');
const { ensureDataDir, loadToken } = require('./lib/data');
const { nameOf } = require('./lib/entities');
const { buildDashboard, hasViews, writeDashboard, migrateTheme } = require('./lib/dashboard');
const { createAuth } = require('./lib/auth');
const { pickGraphEntities } = require('./lib/history');

/** Turn `a.*, b.c.*` into a matcher over ioBroker ids */
function makeFilter(patterns) {
	const list = String(patterns || '*')
		.split(/[,\n]/)
		.map((p) => p.trim())
		.filter(Boolean);
	const regexes = list.map(
		(p) => new RegExp(`^${p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`)
	);
	return (id) => regexes.some((r) => r.test(id));
}

class IoFusion extends utils.Adapter {
	constructor(options) {
		super({ ...options, name: 'iofusion' });
		this.server = undefined;
		this.bridge = undefined;
		this.stateCallbacks = [];
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', (id, state) => this.stateCallbacks.forEach((cb) => cb(id, state)));
		this.on('message', (obj) => this.onMessage(obj));
		this.on('objectChange', (id, obj) => this.onObjectChange(id, obj));
		this.on('unload', this.onUnload.bind(this));
	}

	/** New, changed or deleted states change the entity list; collect bursts into one refresh. */
	onObjectChange(id, obj) {
		if (!this.bridge || id.startsWith(`${this.namespace}.`)) return;
		const relevant = obj ? obj.type === 'state' : this.bridge.byIobId.has(id);
		if (!relevant) return;
		if (obj && id.startsWith('system.')) return;
		clearTimeout(this.refreshTimer);
		this.refreshTimer = setTimeout(() => {
			this.bridge.refresh().catch((error) => this.log.warn(`ioFusion: refresh failed: ${error?.message || error}`));
		}, 3000);
	}

	/** enum.rooms / enum.functions as [{id, name, members}] */
	async readEnum(kind) {
		const view = await this.getObjectViewAsync('system', 'enum', {
			startkey: `enum.${kind}.`,
			endkey: `enum.${kind}.\u9999`
		});
		return (view?.rows || []).map((row) => ({
			id: row.id,
			name: nameOf(row.value, row.id.replace(`enum.${kind}.`, '')),
			members: row.value?.common?.members || []
		}));
	}

	/** Ask a history adapter (history, influxdb, sql) for recorded values. */
	queryHistory(instance, id, { start, end, step, aggregate }) {
		return new Promise((resolve) => {
			if (!instance) return resolve([]);
			const timer = setTimeout(() => resolve([]), 20000);
			this.sendTo(
				instance,
				'getHistory',
				{
					id,
					options: {
						start,
						end,
						aggregate,
						...(step ? { step } : {}),
						count: 2000,
						ignoreNull: true,
						addId: false
					}
				},
				(reply) => {
					clearTimeout(timer);
					if (reply?.error) this.log.debug(`ioFusion: history for ${id}: ${reply.error}`);
					resolve(Array.isArray(reply?.result) ? reply.result : []);
				}
			);
		});
	}

	/** Rebuild dashboard.yaml from the ioBroker rooms (enum.rooms). */
	async generateDashboard() {
		const rooms = await this.iob.rooms();
		const groupBy = this.config.groupBy === 'function' ? 'function' : 'type';
		const dashboard = buildDashboard({
			registry: this.bridge.registry,
			rooms,
			groupBy,
			functions: groupBy === 'function' ? await this.iob.functions() : [],
			lang: this.language,
			graphEntityIds: pickGraphEntities(this.bridge.registry, this.iob.historyInstance)
		});
		const backup = writeDashboard(this.dataDir, dashboard);
		this.log.info(`ioFusion: dashboard generated (${dashboard.views.length} views${backup ? `, backup ${backup}` : ''})`);
		return { views: dashboard.views.length, backup };
	}

	async onMessage(obj) {
		if (obj?.command !== 'generateDashboard') return;
		let response;
		try {
			const { views, backup } = await this.generateDashboard();
			response = {
				result: views
					? `Dashboard created with ${views} views${backup ? ' (previous version saved as backup)' : ''}. Reload the browser.`
					: 'No rooms or devices found, dashboard unchanged.'
			};
		} catch (error) {
			response = { error: String(error?.message || error) };
		}
		if (obj.callback) this.sendTo(obj.from, obj.command, response, obj.callback);
	}

	async onReady() {
		this.setState('info.connection', false, true);
		const { port, bind, include, invertCover, authEnabled, username, password, historyInstance } = this.config;
		const matches = makeFilter(include);
		const own = `${this.namespace}.`;

		const iob = (this.iob = {
			list: async () => {
				const view = await this.getObjectViewAsync('system', 'state', {});
				const objects = (view?.rows || [])
					.map((row) => ({ id: row.id, obj: row.value }))
					.filter(({ id }) => !id.startsWith('system.') && !id.startsWith(own) && matches(id));
				const states = await this.getForeignStatesAsync('*');
				return objects.map((o) => ({ ...o, state: states?.[o.id] ?? null }));
			},
			rooms: () => this.readEnum('rooms'),
			functions: () => this.readEnum('functions'),
			historyInstance: String(historyInstance || '').trim(),
			history: (id, options) => this.queryHistory(String(historyInstance).trim(), id, options),
			setState: async (id, val) => {
				await this.setForeignStateAsync(id, { val, ack: false });
			},
			onStateChange: (cb) => this.stateCallbacks.push(cb)
		});

		const dataDir = (this.dataDir = path.join(utils.getAbsoluteInstanceDataDir(this), 'data'));
		ensureDataDir(dataDir);
		const token = loadToken(dataDir);
		this.bridge = new Bridge(iob, {
			token,
			invertCover,
			log: this.log,
			config: { latitude: this.latitude, longitude: this.longitude, language: this.language }
		});
		await this.bridge.init();
		await this.subscribeForeignStatesAsync('*');
		await this.subscribeForeignObjectsAsync('*');

		// first start: build a dashboard from the rooms so the page is not empty
		if (!hasViews(dataDir)) {
			try {
				await this.generateDashboard();
			} catch (error) {
				this.log.warn(`ioFusion: could not generate dashboard: ${error?.message || error}`);
			}
		}

		try {
			if (migrateTheme(dataDir)) this.log.info('ioFusion: the old default theme "godis" was replaced by "iofusion" (one time, backup saved)');
		} catch (error) {
			this.log.warn(`ioFusion: theme migration failed: ${error?.message || error}`);
		}

		let auth;
		try {
			auth = createAuth({ enabled: !!authEnabled, username, password, dataDir, lang: this.language, log: this.log });
		} catch (error) {
			// fail closed: never start an open server when a login was requested
			this.log.error(`ioFusion: ${error.message}. The web server is not started.`);
			return;
		}
		if (!auth.enabled) {
			this.log.warn('ioFusion: login is disabled, everybody who can reach the port can control your devices');
		}

		this.server = await startServer({
			auth,
			port: Number(port) || 8095,
			bind: bind || '0.0.0.0',
			dataDir,
			token,
			bridge: this.bridge,
			log: this.log
		});
		this.setState('info.connection', true, true);
	}

	onUnload(callback) {
		try {
			clearTimeout(this.refreshTimer);
			this.bridge?.close();
			this.server?.close();
			this.setState('info.connection', false, true);
		} finally {
			callback();
		}
	}
}

if (require.main !== module) {
	module.exports = (options) => new IoFusion(options);
} else {
	new IoFusion();
}
