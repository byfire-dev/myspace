import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, scryptSync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { request } from 'node:http';
import { configFromEnv, createApp, validateEnrollment } from './server.mjs';
import { openStore, csvCell } from './storage.mjs';
import { COURSE_NAMES, formatBeijingTime, formatCourses } from './constants.mjs';

const origin = 'https://myspace.byfire.ai';
const password = 'test-password-long-enough';
const salt = Buffer.alloc(16, 42);
const hash = `scrypt$${salt.toString('hex')}$${scryptSync(password, salt, 64).toString('hex')}`;
const adminAuth = 'Basic ' + Buffer.from(`test_admin:${password}`).toString('base64');
const here = dirname(fileURLToPath(import.meta.url));
const config = () => configFromEnv({ LIYOXI_ADMIN_USER: 'test_admin', LIYOXI_ADMIN_PASSWORD_HASH: hash });
const payload = (changes = {}) => ({ requestId: randomUUID(), phone: '13800000000', name: '测试报名', courseIds: [1, 3], source: 'direct', consent: true, website: '', ...changes });

async function listen(store, options = {}) {
  const logs = [];
  const server = createApp(config(), store, { logger: { error: line => logs.push(line) }, ...options });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { server, base, logs, stop: async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
}

async function fixture(t, options) {
  const dir = mkdtempSync(join(tmpdir(), 'liyoxi-test-'));
  const dbPath = join(dir, 'enrollments.sqlite');
  const store = openStore(dbPath);
  const app = await listen(store, options);
  t.after(async () => { await app.stop(); store.close(); rmSync(dir, { recursive: true, force: true }); });
  return { ...app, dir, dbPath, store };
}

async function post(base, value, headers = {}) {
  const response = await fetch(base + '/liyoxi/api/enrollments', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: typeof value === 'string' ? value : JSON.stringify(value) });
  return { response, body: await response.json() };
}

test('configuration fails closed for missing credentials and supports explicit local origins', () => {
  assert.throws(() => configFromEnv({}), /ADMIN_USER/);
  assert.throws(() => configFromEnv({ LIYOXI_ADMIN_USER: 'a', LIYOXI_ADMIN_PASSWORD_HASH: '' }), /PASSWORD_HASH/);
  const local = configFromEnv({ LIYOXI_ADMIN_USER: 'a', LIYOXI_ADMIN_PASSWORD_HASH: hash, LIYOXI_ALLOWED_ORIGINS: origin + ',http://127.0.0.1:8796' });
  assert.equal(local.allowedOrigins.has('http://127.0.0.1:8796'), true);
});

test('valid input is normalized and invalid data types or values are rejected', () => {
  const requestId = randomUUID();
  const result = validateEnrollment(payload({ requestId: requestId.toUpperCase(), name: ' 小狸 ', courseIds: [13, 1, 1] }));
  assert.equal(result.requestId, requestId); assert.equal(result.name, '小狸'); assert.deepEqual(result.courseIds, [1, 13]);
  assert.deepEqual(validateEnrollment(payload({ courseIds: [], name: undefined })).courseIds, []);
  const invalid = [null, [], 'text', { ...payload(), extra: 1 }, payload({ requestId: 'bad' }), payload({ phone: 13800000000 }), payload({ phone: '12800000000' }), payload({ name: 1 }), payload({ name: '字'.repeat(51) }), payload({ name: 'a\u0000b' }), payload({ courseIds: ['1'] }), payload({ courseIds: [0] }), payload({ courseIds: [14] }), payload({ courseIds: {} }), payload({ source: '__proto__' }), payload({ consent: 'true' }), payload({ website: 'spam' })];
  for (const value of invalid) assert.throws(() => validateEnrollment(value), error => error.status === 400);
});

test('course names and Beijing time formatting cover every course and UTC day rollover', () => {
  assert.equal(Object.keys(COURSE_NAMES).length, 13);
  assert.equal(formatCourses([1, 13]), '1. 音频+AIGC：MV带货；13. 视频GEO');
  assert.equal(formatCourses([]), '请顾问推荐');
  assert.equal(formatBeijingTime('2026-10-31T16:05:09.000Z'), '2026-11-01 00:05:09');
});

test('POST persists after a restart, retries are idempotent, changed payload returns 409', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'liyoxi-persist-'));
  const path = join(dir, 'enrollments.sqlite');
  let store = openStore(path);
  let app = await listen(store);
  t.after(async () => { await app.stop(); store.close(); rmSync(dir, { recursive: true, force: true }); });
  const value = payload();
  const first = await post(app.base, value);
  assert.equal(first.response.status, 201); assert.equal(first.body.ok, true); assert.match(first.body.registrationId, /^[a-f0-9-]{36}$/); assert.ok(Date.parse(first.body.createdAt));
  await app.stop(); store.close();
  store = openStore(path); app = await listen(store);
  const retry = await post(app.base, { ...value, name: ' 测试报名 ', courseIds: [3, 1, 1] });
  assert.equal(retry.response.status, 200); assert.deepEqual(retry.body, first.body); assert.equal(store.count(), 1);
  const conflict = await post(app.base, { ...value, phone: '13900000000' });
  assert.equal(conflict.response.status, 409); assert.equal(conflict.body.ok, false); assert.equal(conflict.body.error.code, 'REQUEST_CONFLICT'); assert.equal(store.count(), 1);
});

test('origin, JSON, content type, body size, method, and health checks', async t => {
  const app = await fixture(t);
  assert.deepEqual(await (await fetch(app.base + '/liyoxi/api/health')).json(), { ok: true });
  assert.equal((await fetch(app.base + '/liyoxi/api/health', { method: 'POST' })).status, 405);
  const denied = await post(app.base, payload(), { Origin: 'https://evil.example' }); assert.equal(denied.response.status, 403);
  const missing = await fetch(app.base + '/liyoxi/api/enrollments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) }); assert.equal(missing.status, 403);
  assert.equal((await post(app.base, '{broken')).response.status, 400);
  assert.equal((await post(app.base, payload(), { 'Content-Type': 'text/plain' })).response.status, 415);
  assert.equal((await post(app.base, payload(), { 'Content-Encoding': 'gzip' })).response.status, 415);
  assert.equal((await post(app.base, 'x'.repeat(8193))).response.status, 413);
  const get = await fetch(app.base + '/liyoxi/api/enrollments', { headers: { Origin: origin } }); assert.equal(get.status, 405);
  const options = await fetch(app.base + '/liyoxi/api/enrollments', { method: 'OPTIONS', headers: { Origin: origin } }); assert.equal(options.status, 204); assert.equal(options.headers.get('access-control-allow-origin'), origin);
  assert.equal((await fetch(app.base + '/nothing')).status, 404); assert.equal(app.store.count(), 0);
});

test('chunked oversized requests receive a real 413 response', async t => {
  const app = await fixture(t);
  const result = await new Promise((resolve, reject) => {
    const req = request(app.base + '/liyoxi/api/enrollments', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' } }, res => {
      let body = ''; res.setEncoding('utf8'); res.on('data', chunk => body += chunk); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject); req.write('x'.repeat(4096)); req.write('x'.repeat(4097)); req.end();
  });
  assert.equal(result.status, 413); assert.equal(result.body.ok, false); assert.equal(app.store.count(), 0);
});

test('admin endpoints deny missing/wrong auth; authenticated pages escape HTML and CSV formulas', async t => {
  const app = await fixture(t);
  await post(app.base, payload({ name: '<img src=x onerror=alert(1)>' }));
  await post(app.base, payload({ name: '=HYPERLINK("evil")' }));
  for (const route of ['/liyoxi/admin', '/liyoxi/admin/', '/liyoxi/admin/export.csv']) {
    const response = await fetch(app.base + route);
    assert.equal(response.status, 401); assert.ok(response.headers.get('www-authenticate')); assert.equal((await response.text()).includes('13800000000'), false);
  }
  assert.equal((await fetch(app.base + '/liyoxi/admin/', { headers: { Authorization: 'Basic ' + Buffer.from('test_admin:wrong').toString('base64') } })).status, 401);
  const html = await fetch(app.base + '/liyoxi/admin/', { headers: { Authorization: adminAuth } });
  assert.equal(html.status, 200); assert.equal(html.headers.get('cache-control'), 'no-store');
  const markup = await html.text(); assert.ok(markup.includes('&lt;img')); assert.equal(markup.includes('<img'), false);
  assert.ok(markup.includes('1. 音频+AIGC：MV带货；3. 口播+特效模版带货')); assert.ok(markup.includes('提交时间（北京时间）'));
  assert.ok(markup.includes(formatBeijingTime(app.store.latest()[0].created_at)));
  const csv = await fetch(app.base + '/liyoxi/admin/export.csv', { headers: { Authorization: adminAuth } });
  assert.equal(csv.status, 200); assert.match(csv.headers.get('content-disposition'), /attachment/);
  const csvText = await csv.text(); assert.ok(csvText.includes('"\'=HYPERLINK(""evil"")"'));
  assert.ok(csvText.includes('1. 音频+AIGC：MV带货；3. 口播+特效模版带货')); assert.ok(csvText.includes('提交时间（北京时间）')); assert.ok(csvText.includes('直接访问'));
  assert.ok(csvText.includes(formatBeijingTime(app.store.latest()[0].created_at)));
  assert.equal((await fetch(app.base + '/liyoxi/admin/', { method: 'POST', headers: { Authorization: adminAuth } })).status, 405);
  for (const malicious of ['=SUM(1)', '+1', '-1', '@calc', '  =x', '\tx', '\rx']) assert.ok(csvCell(malicious).startsWith('"\''));
});

test('rate limiting returns 429 without inserting another record', async t => {
  const app = await fixture(t, { postLimit: 1, rateWindowMs: 60000 });
  assert.equal((await post(app.base, payload())).response.status, 201);
  const limited = await post(app.base, payload()); assert.equal(limited.response.status, 429); assert.ok(Number(limited.response.headers.get('retry-after')) > 0); assert.equal(limited.body.ok, false); assert.equal(app.store.count(), 1);
});

test('storage failures produce 500, never false success or personal data in logs', async t => {
  const store = { save() { throw new Error('13800000000 should never be logged'); }, health() { throw new Error('db failure'); } };
  const app = await listen(store); t.after(app.stop);
  const result = await post(app.base, payload()); assert.equal(result.response.status, 500); assert.equal(result.body.ok, false); assert.equal(result.body.registrationId, undefined);
  assert.equal((await fetch(app.base + '/liyoxi/api/health')).status, 500);
  assert.equal(app.logs.join('\n').includes('13800000000'), false); assert.equal(JSON.stringify(result.body).includes('13800000000'), false);
});

test('CLI exports private files and deletes only the requested registration', async t => {
  const app = await fixture(t);
  const first = await post(app.base, payload()); await post(app.base, payload({ phone: '13900000000' }));
  const output = join(app.dir, 'export.csv');
  const exported = spawnSync(process.execPath, [join(here, 'cli.mjs'), 'export', '--db', app.dbPath, '--output', output], { encoding: 'utf8' });
  assert.equal(exported.status, 0, exported.stderr); assert.ok(readFileSync(output, 'utf8').includes(first.body.registrationId)); assert.equal(exported.stdout.includes('13800000000'), false);
  const deleted = spawnSync(process.execPath, [join(here, 'cli.mjs'), 'delete', '--db', app.dbPath, '--id', first.body.registrationId], { encoding: 'utf8' });
  assert.equal(deleted.status, 0, deleted.stderr); assert.equal(JSON.parse(deleted.stdout).deleted, 1); assert.equal(app.store.count(), 1);
});

test('credential generator writes working credentials without printing secrets and refuses accidental overwrite', t => {
  const dir = mkdtempSync(join(tmpdir(), 'liyoxi-credentials-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const envPath = join(dir, 'liyoxi.env'); const credentialsPath = join(dir, 'credentials.txt');
  const args = [join(here, 'create-admin-env.mjs'), '--env', envPath, '--credentials', credentialsPath];
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' }); assert.equal(result.status, 0, result.stderr);
  const credentials = readFileSync(credentialsPath, 'utf8'); const secret = credentials.match(/Password: (.+)/)[1]; assert.equal((result.stdout + result.stderr).includes(secret), false);
  const values = Object.fromEntries(readFileSync(envPath, 'utf8').trim().split('\n').map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
  assert.equal(configFromEnv(values).adminUser, 'liyoxi_admin');
  const [, generatedSalt, generatedHash] = values.LIYOXI_ADMIN_PASSWORD_HASH.split('$'); assert.equal(scryptSync(secret, Buffer.from(generatedSalt, 'hex'), 64).toString('hex'), generatedHash);
  const retry = spawnSync(process.execPath, args, { encoding: 'utf8' }); assert.notEqual(retry.status, 0); assert.equal(readFileSync(credentialsPath, 'utf8'), credentials);
});
