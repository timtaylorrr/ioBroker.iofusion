'use strict';

const crypto = require('node:crypto');
const path = require('node:path');
const utils = require('@iobroker/adapter-core');
const { Bridge } = require('./lib/bridge');
const { startServer } = require('./lib/server');
const { ensureDataDir } = require('./lib/data');
const { nameOf } = require('./lib/entities');
const { buildDashboard, hasViews, writeDashboard } = require('./lib/dashboard');

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
		this.on('unload', this.onUnload.bind(this));
	}

	/** Rebuild dashboard.yaml from the ioBroker rooms (enum.rooms). */
	async generateDashboard() {
		const rooms = await this.iob.rooms();
		const dashboard = buildDashboard({
			registry: this.bridge.registry,
			rooms,
			lang: this.language
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
		const { port, bind, include, invertCover } = this.config;
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
			rooms: async () => {
				const view = await this.getObjectViewAsync('system', 'enum', {
					startkey: 'enum.rooms.',
					endkey: 'enum.rooms.\u9999'
				});
				return (view?.rows || []).map((row) => ({
					id: row.id,
					name: nameOf(row.value, row.id.replace('enum.rooms.', '')),
					members: row.value?.common?.members || []
				}));
			},
			setState: async (id, val) => {
				await this.setForeignStateAsync(id, { val, ack: false });
			},
			onStateChange: (cb) => this.stateCallbacks.push(cb)
		});

		const token = crypto.randomBytes(24).toString('hex');
		this.bridge = new Bridge(iob, {
			token,
			invertCover,
			log: this.log,
			config: { latitude: this.latitude, longitude: this.longitude, language: this.language }
		});
		await this.bridge.init();
		await this.subscribeForeignStatesAsync('*');

		const dataDir = (this.dataDir = path.join(utils.getAbsoluteInstanceDataDir(this), 'data'));
		ensureDataDir(dataDir);
		// first start: build a dashboard from the rooms so the page is not empty
		if (!hasViews(dataDir)) {
			try {
				await this.generateDashboard();
			} catch (error) {
				this.log.warn(`ioFusion: could not generate dashboard: ${error?.message || error}`);
			}
		}

		this.server = await startServer({
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
