'use strict';

const crypto = require('node:crypto');
const path = require('node:path');
const utils = require('@iobroker/adapter-core');
const { Bridge } = require('./lib/bridge');
const { startServer } = require('./lib/server');
const { ensureDataDir } = require('./lib/data');

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
		this.on('unload', this.onUnload.bind(this));
	}

	async onReady() {
		this.setState('info.connection', false, true);
		const { port, bind, include, invertCover } = this.config;
		const matches = makeFilter(include);
		const own = `${this.namespace}.`;

		const iob = {
			list: async () => {
				const view = await this.getObjectViewAsync('system', 'state', {});
				const objects = (view?.rows || [])
					.map((row) => ({ id: row.id, obj: row.value }))
					.filter(({ id }) => !id.startsWith('system.') && !id.startsWith(own) && matches(id));
				const states = await this.getForeignStatesAsync('*');
				return objects.map((o) => ({ ...o, state: states?.[o.id] ?? null }));
			},
			setState: async (id, val) => {
				await this.setForeignStateAsync(id, { val, ack: false });
			},
			onStateChange: (cb) => this.stateCallbacks.push(cb)
		};

		const token = crypto.randomBytes(24).toString('hex');
		this.bridge = new Bridge(iob, {
			token,
			invertCover,
			log: this.log,
			config: { latitude: this.latitude, longitude: this.longitude, language: this.language }
		});
		await this.bridge.init();
		await this.subscribeForeignStatesAsync('*');

		const dataDir = path.join(utils.getAbsoluteInstanceDataDir(this), 'data');
		ensureDataDir(dataDir);

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
