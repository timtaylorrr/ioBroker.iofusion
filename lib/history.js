'use strict';

const { stateString } = require('./entities');

const PERIOD_MS = {
	'5minute': 5 * 60 * 1000,
	hour: 3600 * 1000,
	day: 86400 * 1000,
	week: 7 * 86400 * 1000,
	month: 30 * 86400 * 1000
};

/** Does this entity have history enabled in the configured history instance? */
function hasHistory(entry, instance) {
	if (!instance) return false;
	return !!entry.obj.common?.custom?.[instance]?.enabled;
}

/** recorder/list_statistic_ids: numeric sensors that have history */
function listStatisticIds(registry, instance) {
	const result = [];
	for (const [entityId, entry] of registry) {
		if (entry.domain !== 'sensor' || !hasHistory(entry, instance)) continue;
		const unit = entry.obj.common.unit ?? null;
		result.push({
			statistic_id: entityId,
			name: null,
			source: 'recorder',
			has_mean: true,
			has_sum: false,
			unit_class: null,
			statistics_unit_of_measurement: unit,
			display_unit_of_measurement: unit
		});
	}
	return result;
}

const toMs = (value, fallback) => {
	const ms = new Date(value).getTime();
	return Number.isFinite(ms) ? ms : fallback;
};

/**
 * recorder/statistics_during_period: one averaged value per period bucket.
 * @param {{history?: Function, historyInstance?: string}} iob
 */
async function statisticsDuringPeriod(iob, registry, msg) {
	const result = {};
	if (!iob.history) return result;
	const end = toMs(msg.end_time, Date.now());
	const start = toMs(msg.start_time, end - 30 * 86400 * 1000);
	const step = PERIOD_MS[msg.period] || PERIOD_MS.hour;

	for (const entityId of msg.statistic_ids || []) {
		const entry = registry.get(entityId);
		if (!entry || !hasHistory(entry, iob.historyInstance)) continue;
		const rows = await iob.history(entry.id, { start, end, step, aggregate: 'average' });
		result[entityId] = rows
			.filter((row) => typeof row.val === 'number' && Number.isFinite(row.val))
			.sort((a, b) => a.ts - b.ts)
			.map((row) => ({
				start: row.ts,
				end: row.ts + step,
				mean: Math.round(row.val * 1000) / 1000,
				min: Math.round(row.val * 1000) / 1000,
				max: Math.round(row.val * 1000) / 1000
			}));
	}
	return result;
}

/**
 * history/stream: state changes for the timeline bar. Seconds as timestamps (`lu`).
 */
async function historyStream(iob, registry, states, msg) {
	const out = { start_time: 0, states: {} };
	const end = toMs(msg.end_time, Date.now());
	const start = toMs(msg.start_time, end - 3600 * 1000);
	out.start_time = start / 1000;

	for (const entityId of msg.entity_ids || []) {
		const entry = registry.get(entityId);
		if (!entry) continue;
		let rows = [];
		if (iob.history && hasHistory(entry, iob.historyInstance)) {
			rows = await iob.history(entry.id, { start, end, aggregate: 'onchange' });
		}
		rows = rows.filter((r) => r.ts <= end).sort((a, b) => a.ts - b.ts);
		let list = rows.map((r) => ({ s: stateString(entry.domain, entry.obj, r.val), lu: Math.max(r.ts, start) / 1000 }));
		// without recorded changes show the current state for the whole window
		if (!list.length) {
			const current = states.get(entry.id);
			list = [{ s: stateString(entry.domain, entry.obj, current?.val ?? null), lu: start / 1000 }];
		} else if (list[0].lu > start / 1000) {
			list.unshift({ s: list[0].s, lu: start / 1000 });
		}
		out.states[entityId] = list;
	}
	return out;
}

/** Sensors that make good sidebar graphs: temperature, power and energy first */
function pickGraphEntities(registry, instance, max = 3) {
	const rank = (entry) => {
		const role = String(entry.obj.common.role || '');
		if (role.includes('temperature')) return 0;
		if (role.startsWith('value.power') || role.startsWith('value.energy')) return 1;
		return 2;
	};
	return [...registry]
		.filter(([, entry]) => entry.domain === 'sensor' && hasHistory(entry, instance) && entry.obj.common.type === 'number')
		.sort((a, b) => rank(a[1]) - rank(b[1]))
		.slice(0, max)
		.map(([entityId]) => entityId);
}

module.exports = { pickGraphEntities, PERIOD_MS, hasHistory, listStatisticIds, statisticsDuringPeriod, historyStream };
