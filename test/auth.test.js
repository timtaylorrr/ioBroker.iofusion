'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createAuth, COOKIE } = require('../lib/auth');

async function withServer(options, fn) {
	const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iofusion-auth-'));
	const auth = createAuth({ enabled: true, username: 'tim', password: 's3cret', dataDir, failDelayMs: 0, ...options });
	const server = http.createServer((req, res) => {
		if (auth.handle(req, res)) return;
		res.end('protected');
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	const base = `http://127.0.0.1:${server.address().port}`;
	try {
		await fn({ base, auth, dataDir });
	} finally {
		server.close();
		fs.rmSync(dataDir, { recursive: true, force: true });
	}
}

const post = (base, body, headers = {}) =>
	fetch(`${base}/login`, {
		method: 'POST',
		redirect: 'manual',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
		body: new URLSearchParams(body).toString()
	});

const cookieOf = (res) => res.headers.get('set-cookie').split(';')[0];

test('disabled auth lets everything through', () => {
	const auth = createAuth({ enabled: false });
	assert.strictEqual(auth.handle({}, {}), false);
	assert.strictEqual(auth.isAuthed({}), true);
});

test('enabled without credentials refuses to start', () => {
	assert.throws(() => createAuth({ enabled: true, username: '', password: '' }), /empty/);
});

test('unauthenticated requests are redirected or rejected', async () => {
	await withServer({}, async ({ base }) => {
		const page = await fetch(`${base}/`, { redirect: 'manual', headers: { Accept: 'text/html' } });
		assert.strictEqual(page.status, 302);
		assert.strictEqual(page.headers.get('location'), '/login');
		const api = await fetch(`${base}/_api/save_dashboard`, { method: 'POST' });
		assert.strictEqual(api.status, 401);
		const login = await fetch(`${base}/login`);
		assert.strictEqual(login.status, 200);
		assert.match(await login.text(), /<form/);
	});
});

test('wrong credentials are rejected without a cookie, right ones open a session', async () => {
	await withServer({}, async ({ base }) => {
		const bad = await post(base, { username: 'tim', password: 'nope' });
		assert.strictEqual(bad.status, 401);
		assert.strictEqual(bad.headers.get('set-cookie'), null);

		const good = await post(base, { username: 'tim', password: 's3cret' });
		assert.strictEqual(good.status, 302);
		const set = good.headers.get('set-cookie');
		assert.match(set, /HttpOnly/);
		assert.match(set, /SameSite=Lax/);
		assert.ok(!/Secure/.test(set));

		const ok = await fetch(`${base}/`, { headers: { Cookie: cookieOf(good) } });
		assert.strictEqual(await ok.text(), 'protected');
	});
});

test('Secure flag is set behind an https proxy', async () => {
	await withServer({}, async ({ base }) => {
		const res = await post(base, { username: 'tim', password: 's3cret' }, { 'X-Forwarded-Proto': 'https' });
		assert.match(res.headers.get('set-cookie'), /Secure/);
	});
});

test('tampered, foreign and expired sessions are rejected', async () => {
	let clock = Date.now();
	await withServer({ now: () => clock }, async ({ base, auth }) => {
		const token = auth.issue();
		const asReq = (value) => ({ headers: { cookie: `${COOKIE}=${value}` } });
		assert.strictEqual(auth.isAuthed(asReq(token)), true);
		assert.strictEqual(auth.isAuthed(asReq(`${token}x`)), false);
		const [exp, user, sig] = token.split('.');
		assert.strictEqual(auth.isAuthed(asReq(`${Number(exp) + 1}.${user}.${sig}`)), false);
		assert.strictEqual(auth.isAuthed({ headers: {} }), false);
		clock += 31 * 24 * 3600 * 1000;
		assert.strictEqual(auth.isAuthed(asReq(token)), false);
	});
});

test('a session from another password or secret is invalid', async () => {
	const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iofusion-auth-'));
	try {
		const a = createAuth({ enabled: true, username: 'tim', password: 'one', dataDir });
		const b = createAuth({ enabled: true, username: 'tim', password: 'two', dataDir });
		const req = { headers: { cookie: `${COOKIE}=${a.issue()}` } };
		assert.strictEqual(a.isAuthed(req), true);
		assert.strictEqual(b.isAuthed(req), false); // password changed
		const again = createAuth({ enabled: true, username: 'tim', password: 'one', dataDir });
		assert.strictEqual(again.isAuthed(req), true); // survives a restart
	} finally {
		fs.rmSync(dataDir, { recursive: true, force: true });
	}
});

test('logout clears the cookie', async () => {
	await withServer({}, async ({ base }) => {
		const res = await fetch(`${base}/logout`, { redirect: 'manual' });
		assert.strictEqual(res.status, 302);
		assert.match(res.headers.get('set-cookie'), /Max-Age=0/);
	});
});

test('five failed attempts lock the login for a minute', async () => {
	let clock = 1_000_000;
	await withServer({ now: () => clock }, async ({ base }) => {
		for (let i = 0; i < 5; i++) assert.strictEqual((await post(base, { username: 'tim', password: 'x' })).status, 401);
		assert.strictEqual((await post(base, { username: 'tim', password: 's3cret' })).status, 429);
		clock += 61_000;
		assert.strictEqual((await post(base, { username: 'tim', password: 's3cret' })).status, 302);
	});
});
