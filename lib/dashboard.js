'use strict';

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const { nameOf } = require('./entities');

const GROUPS = [
	{ key: 'lights', domains: ['light', 'switch'], de: 'Licht & Schalter', en: 'Lights & switches' },
	{ key: 'covers', domains: ['cover'], de: 'Rollläden', en: 'Blinds' },
	{ key: 'climate', domains: ['climate'], de: 'Klima', en: 'Climate' },
	{ key: 'sensors', domains: ['sensor', 'binary_sensor'], de: 'Sensoren', en: 'Sensors' },
	{ key: 'actions', domains: ['button'], de: 'Aktionen', en: 'Actions' }
];

// first matching keyword wins
const ROOM_ICONS = [
	[/wohn|living|salon/i, 'mdi:sofa'],
	[/schlaf|bed/i, 'mdi:bed'],
	[/küche|kueche|kitchen/i, 'mdi:silverware-fork-knife'],
	[/bad|wc|dusche|bath|toilet/i, 'mdi:shower'],
	[/flur|diele|eingang|hall|entry/i, 'mdi:door'],
	[/kind|child|nursery/i, 'mdi:teddy-bear'],
	[/büro|buero|office|arbeit/i, 'mdi:desk'],
	[/garten|terrasse|balkon|garden|patio|terrace|balcony/i, 'mdi:flower'],
	[/keller|basement|cellar/i, 'mdi:stairs-down'],
	[/garage/i, 'mdi:garage'],
	[/dach|attic|boden/i, 'mdi:home-roof'],
	[/wasch|hauswirtschaft|laundry/i, 'mdi:washing-machine'],
	[/essen|dining/i, 'mdi:table-furniture']
];

/** Rooms are enums; members are state, channel or device ids. */
function belongsTo(iobId, member) {
	return iobId === member || iobId.startsWith(`${member}.`);
}

/**
 * Which entity ids live in which room.
 * @param {Map<string, {id: string}>} registry
 * @param {Array<{id: string, name: string, members: string[]}>} rooms
 * @returns {Array<{id: string, name: string, entityIds: string[]}>}
 */
function resolveRooms(registry, rooms) {
	return rooms.map((room) => ({
		id: room.id,
		name: room.name,
		entityIds: [...registry]
			.filter(([, entry]) => room.members.some((m) => belongsTo(entry.id, m)))
			.map(([entityId]) => entityId)
	}));
}

/** "Wohnzimmer Licht" in room "Wohnzimmer" -> "Licht" */
function shortName(name, room) {
	const lower = name.toLowerCase();
	const prefix = room.toLowerCase();
	if (lower.startsWith(prefix) && name.length > room.length) {
		const rest = name.slice(room.length).replace(/^[\s\-–:_.]+/, '');
		if (rest) return rest.charAt(0).toUpperCase() + rest.slice(1);
	}
	return undefined;
}

/**
 * Build a dashboard (the object that is stored as dashboard.yaml).
 * @param {{registry: Map<string, object>, rooms: Array, lang?: string, theme?: string, maxUnassigned?: number}} options
 */
function buildDashboard({ registry, rooms, lang = 'en', theme = 'iofusion', maxUnassigned = 40 }) {
	const l = lang === 'de' ? 'de' : 'en';
	let nextId = 1000;
	const id = () => nextId++;

	const resolved = resolveRooms(registry, rooms);
	const assigned = new Set(resolved.flatMap((r) => r.entityIds));
	const unassigned = [...registry.keys()].filter((e) => !assigned.has(e));

	const makeView = (name, entityIds, icon) => {
		const sections = [];
		for (const group of GROUPS) {
			const items = entityIds
				.filter((e) => group.domains.includes(e.split('.')[0]))
				.map((entityId) => {
					const entry = registry.get(entityId);
					const friendly = nameOf(entry.obj, entry.id);
					const short = icon ? shortName(friendly, name) : undefined;
					return { label: short || friendly, item: { type: 'button', entity_id: entityId, id: id(), ...(short ? { name: short } : {}) } };
				})
				.sort((a, b) => a.label.localeCompare(b.label, l));
			if (items.length) sections.push({ name: group[l], id: id(), items: items.map((i) => i.item) });
		}
		if (!sections.length) return undefined;
		return {
			name,
			id: id(),
			...(icon ? { icon } : {}),
			sections
		};
	};

	const views = [];
	for (const room of resolved) {
		const icon = (ROOM_ICONS.find(([re]) => re.test(room.name)) || [])[1] || 'mdi:home-outline';
		const view = makeView(room.name, room.entityIds, icon);
		if (view) views.push(view);
	}
	if (unassigned.length && unassigned.length <= maxUnassigned) {
		const view = makeView(l === 'de' ? 'Weitere' : 'Other', unassigned, 'mdi:dots-horizontal');
		if (view) views.push(view);
	}

	return { theme, hide_views: false, hide_sidebar: true, views, sidebar: [] };
}

function hasViews(dataDir) {
	try {
		const data = yaml.load(fs.readFileSync(path.join(dataDir, 'dashboard.yaml'), 'utf8'));
		return Array.isArray(data?.views) && data.views.length > 0;
	} catch {
		return false;
	}
}

/**
 * Write dashboard.yaml; an existing file is kept as dashboard.yaml.bak-<timestamp>.
 * @returns {string|undefined} path of the backup
 */
function writeDashboard(dataDir, dashboard) {
	const file = path.join(dataDir, 'dashboard.yaml');
	let backup;
	if (fs.existsSync(file)) {
		backup = `${file}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
		fs.copyFileSync(file, backup);
	}
	fs.writeFileSync(file, yaml.dump(dashboard, { lineWidth: -1 }));
	return backup;
}

module.exports = { buildDashboard, resolveRooms, hasViews, writeDashboard, shortName, belongsTo };
