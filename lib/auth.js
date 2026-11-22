'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const COOKIE = 'iofusion_session';
const SESSION_MS = 30 * 24 * 3600 * 1000;
const MAX_FAILURES = 5;
const LOCK_MS = 60 * 1000;

const TEXT = {
	en: {
		title: 'Sign in',
		user: 'Username',
		password: 'Password',
		submit: 'Sign in',
		wrong: 'Wrong username or password.',
		locked: 'Too many attempts. Try again in a minute.'
	},
	de: {
		title: 'Anmelden',
		user: 'Benutzername',
		password: 'Passwort',
		submit: 'Anmelden',
		wrong: 'Benutzername oder Passwort falsch.',
		locked: 'Zu viele Versuche. Bitte in einer Minute erneut versuchen.'
	}
};

const sha256 = (value) => crypto.createHash('sha256').update(value).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha256(String(a)), sha256(String(b)));
const b64 = (s) => Buffer.from(s).toString('base64url');

const escapeHtml = (s) =>
	String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function loginPage(t, message) {
	return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>ioFusion – ${escapeHtml(t.title)}</title>
<style>
	*{box-sizing:border-box}
	html,body{height:100%;margin:0}
	body{display:grid;place-items:center;padding:1.5rem;color:#e2e8f2;
		font-family:'Inter Variable',Inter,system-ui,-apple-system,'Segoe UI',sans-serif;
		background:radial-gradient(1100px 640px at 8% -8%,rgba(99,102,241,.30),transparent 62%),
		radial-gradient(900px 560px at 104% 4%,rgba(14,165,233,.24),transparent 58%),
		radial-gradient(800px 600px at 50% 112%,rgba(168,85,247,.20),transparent 60%),
		linear-gradient(180deg,#0c1019,#080b11);-webkit-font-smoothing:antialiased}
	main{width:100%;max-width:22rem;padding:2rem;border-radius:1.2rem;
		background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08);
		box-shadow:0 20px 50px -20px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.05);
		backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%)}
	h1{margin:0 0 .25rem;font-size:1.5rem;letter-spacing:-.02em}
	h1 span{background:linear-gradient(90deg,#8b9cff,#38bdf8);-webkit-background-clip:text;background-clip:text;color:transparent}
	p.sub{margin:0 0 1.5rem;color:#8f9bb0;font-size:.9rem}
	label{display:block;margin:0 0 .35rem;font-size:.78rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#8f9bb0}
	input{width:100%;margin:0 0 1rem;padding:.8rem .9rem;border-radius:.7rem;font:inherit;color:inherit;
		background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.1);outline:none;transition:border-color .15s,box-shadow .15s}
	input:focus{border-color:#8b9cff;box-shadow:0 0 0 3px rgba(139,156,255,.25)}
	button{width:100%;padding:.85rem;border:0;border-radius:.7rem;font:inherit;font-weight:600;color:#0b1020;cursor:pointer;
		background:linear-gradient(90deg,#a5b4ff,#7dd3fc);transition:filter .15s,transform .1s}
	button:hover{filter:brightness(1.07)}button:active{transform:scale(.99)}
	.error{margin:0 0 1rem;padding:.7rem .9rem;border-radius:.7rem;font-size:.88rem;color:#fecaca;
		background:rgba(239,68,68,.14);border:1px solid rgba(239,68,68,.35)}
</style></head>
<body><main>
	<h1>io<span>Fusion</span></h1>
	<p class="sub">${escapeHtml(t.title)}</p>
	${message ? `<div class="error" role="alert">${escapeHtml(message)}</div>` : ''}
	<form method="post" action="/login" autocomplete="on">
		<label for="u">${escapeHtml(t.user)}</label>
		<input id="u" name="username" autocomplete="username" autocapitalize="none" required autofocus>
		<label for="p">${escapeHtml(t.password)}</label>
		<input id="p" name="password" type="password" autocomplete="current-password" required>
		<button type="submit">${escapeHtml(t.submit)}</button>
	</form>
</main></body></html>`;
}

function parseCookies(header = '') {
	const out = {};
	for (const part of header.split(';')) {
		const i = part.indexOf('=');
		if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
	}
	return out;
}

function readBody(req, limit = 4096) {
	return new Promise((resolve, reject) => {
		let size = 0;
		const chunks = [];
		req.on('data', (chunk) => {
			size += chunk.length;
			if (size > limit) {
				reject(new Error('too large'));
				req.destroy();
			} else chunks.push(chunk);
		});
		req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
		req.on('error', reject);
	});
}

/**
 * Cookie-session login for the web UI and the WebSocket.
 * Sessions are signed (HMAC) so no server-side session store is needed; the key
 * depends on a random secret in the data directory and on the password, so changing
 * the password logs everybody out.
 *
 * @param {{enabled: boolean, username?: string, password?: string, dataDir?: string, lang?: string, log?: object, now?: () => number}} options
 */
function createAuth(options) {
	const { enabled, log = console } = options;
	const now = options.now || Date.now;
	if (!enabled) {
		return { enabled: false, handle: () => false, isAuthed: () => true };
	}
	const username = String(options.username || '');
	const password = String(options.password || '');
	if (!username || !password) throw new Error('login is enabled but username or password is empty');

	const t = TEXT[options.lang === 'de' ? 'de' : 'en'];

	let secret;
	const secretFile = options.dataDir && path.join(options.dataDir, '.session-secret');
	try {
		secret = secretFile && fs.readFileSync(secretFile, 'utf8').trim();
	} catch {
		/* created below */
	}
	if (!secret) {
		secret = crypto.randomBytes(32).toString('hex');
		if (secretFile) fs.writeFileSync(secretFile, secret, { mode: 0o600 });
	}
	const key = sha256(`${secret}:${username}:${sha256(password).toString('hex')}`);
	const sign = (data) => crypto.createHmac('sha256', key).update(data).digest('base64url');

	const issue = () => {
		const body = `${now() + SESSION_MS}.${b64(username)}`;
		return `${body}.${sign(body)}`;
	};
	const verify = (token) => {
		const parts = String(token || '').split('.');
		if (parts.length !== 3) return false;
		const body = `${parts[0]}.${parts[1]}`;
		const expected = sign(body);
		if (parts[2].length !== expected.length || !safeEqual(parts[2], expected)) return false;
		return Number(parts[0]) > now() && parts[1] === b64(username);
	};

	const isAuthed = (req) => verify(parseCookies(req.headers.cookie)[COOKIE]);

	const failures = new Map(); // ip -> { count, until }
	const ipOf = (req) => req.socket?.remoteAddress || 'unknown';

	const cookie = (req, value, maxAge) => {
		const secure = req.socket?.encrypted || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
		return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
	};

	const send = (res, status, body, headers = {}) => {
		res.writeHead(status, {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'no-store',
			'X-Frame-Options': 'DENY',
			'Referrer-Policy': 'no-referrer',
			...headers
		});
		res.end(body);
	};

	/** @returns {Promise<boolean>|boolean} true if the request was answered here */
	function handle(req, res) {
		const url = new URL(req.url, 'http://localhost');

		if (url.pathname === '/logout') {
			res.writeHead(302, { Location: '/login', 'Set-Cookie': cookie(req, '', 0), 'Cache-Control': 'no-store' });
			res.end();
			return true;
		}

		if (url.pathname === '/login') {
			if (req.method === 'POST') return login(req, res);
			if (isAuthed(req)) {
				res.writeHead(302, { Location: '/' });
				res.end();
				return true;
			}
			send(res, 200, loginPage(t));
			return true;
		}

		if (isAuthed(req)) return false;

		const wantsHtml = req.method === 'GET' && String(req.headers.accept || '').includes('text/html');
		if (wantsHtml) {
			res.writeHead(302, { Location: '/login', 'Cache-Control': 'no-store' });
			res.end();
		} else {
			res.writeHead(401, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
			res.end('{"error":"unauthorized"}');
		}
		return true;
	}

	async function login(req, res) {
		const ip = ipOf(req);
		const entry = failures.get(ip);
		if (entry && entry.until > now()) {
			send(res, 429, loginPage(t, t.locked), { 'Retry-After': '60' });
			return true;
		}
		let form;
		try {
			form = new URLSearchParams(await readBody(req));
		} catch {
			send(res, 400, loginPage(t, t.wrong));
			return true;
		}
		const okUser = safeEqual(form.get('username') || '', username);
		const okPass = safeEqual(form.get('password') || '', password);
		if (okUser && okPass) {
			failures.delete(ip);
			res.writeHead(302, { Location: '/', 'Set-Cookie': cookie(req, issue(), SESSION_MS / 1000), 'Cache-Control': 'no-store' });
			res.end();
			return true;
		}
		const count = (entry?.count || 0) + 1;
		failures.set(ip, { count, until: count >= MAX_FAILURES ? now() + LOCK_MS : 0 });
		log.warn?.(`ioFusion: failed login from ${ip} (${count})`);
		await new Promise((resolve) => setTimeout(resolve, options.failDelayMs ?? 600));
		send(res, 401, loginPage(t, t.wrong));
		return true;
	}

	return { enabled: true, handle, isAuthed, issue };
}

module.exports = { createAuth, COOKIE, parseCookies };
