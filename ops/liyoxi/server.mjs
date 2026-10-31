import { createServer } from 'node:http';
import { scrypt, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { DEFAULT_DB_PATH, openStore, csvRows, escapeHtml } from './storage.mjs';
import { COURSE_NAMES, SOURCE_NAMES, formatBeijingTime, formatCourses } from './constants.mjs';

const scryptAsync = promisify(scrypt);
const MAX_BODY_BYTES = 8192;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

export function configFromEnv(env = process.env) {
  const user = env.LIYOXI_ADMIN_USER?.trim();
  const hash = env.LIYOXI_ADMIN_PASSWORD_HASH;
  if (!user || user.length > 64 || /[:\r\n]/.test(user)) throw new Error('LIYOXI_ADMIN_USER must be nonempty and contain no colon/newline');
  if (!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(hash ?? '')) throw new Error('LIYOXI_ADMIN_PASSWORD_HASH must be a valid scrypt hash; run create-admin-env.mjs');
  const port = Number(env.LIYOXI_PORT || 8797);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid LIYOXI_PORT');
  const allowedOrigins = new Set((env.LIYOXI_ALLOWED_ORIGINS || 'https://myspace.byfire.ai').split(',').map(value => value.trim()).filter(Boolean));
  for (const origin of allowedOrigins) {
    const url = new URL(origin);
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid LIYOXI_ALLOWED_ORIGINS');
  }
  return { port, dbPath: env.LIYOXI_DB_PATH || DEFAULT_DB_PATH, adminUser: user, adminHash: hash, allowedOrigins };
}

export function validateEnrollment(value) {
  const invalid = message => { throw new HttpError(400, 'INVALID_INPUT', message); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('请提交有效的报名信息。');
  const allowed = new Set(['requestId', 'phone', 'name', 'courseIds', 'source', 'consent', 'website']);
  if (Object.keys(value).some(key => !allowed.has(key))) invalid('报名信息包含不支持的字段。');
  if (typeof value.requestId !== 'string' || !UUID.test(value.requestId)) invalid('提交编号无效，请刷新后重试。');
  if (typeof value.phone !== 'string' || !/^1[3-9]\d{9}$/.test(value.phone)) invalid('请填写有效的中国大陆手机号。');
  if (value.name !== undefined && typeof value.name !== 'string') invalid('称呼格式不正确。');
  const name = (value.name ?? '').trim();
  if (name.length > 50 || /[\u0000-\u001f\u007f-\u009f]/u.test(name)) invalid('称呼请控制在 50 个字符内，且不能包含控制字符。');
  if (!Array.isArray(value.courseIds) || value.courseIds.length > 26 || value.courseIds.some(id => !Number.isInteger(id) || !Object.hasOwn(COURSE_NAMES, id))) invalid('意向课程无效，请重新选择。');
  if (typeof value.source !== 'string' || !Object.hasOwn(SOURCE_NAMES, value.source)) invalid('报名来源无效，请刷新后重试。');
  if (value.consent !== true) invalid('请先同意工作人员使用联系方式跟进本次课程咨询。');
  if (value.website !== undefined && value.website !== '') invalid('报名信息校验失败。');
  return {
    requestId: value.requestId.toLowerCase(), phone: value.phone, name,
    courseIds: [...new Set(value.courseIds)].sort((a, b) => a - b), source: value.source, consent: true,
  };
}

function readJson(req) {
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?\s*$/i.test(req.headers['content-type'] || '')) {
    req.resume();
    throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', '请使用 JSON 格式提交。');
  }
  if (req.headers['content-encoding'] && req.headers['content-encoding'] !== 'identity') {
    req.resume();
    throw new HttpError(415, 'UNSUPPORTED_ENCODING', '不支持压缩请求。');
  }
  if (Number(req.headers['content-length']) > MAX_BODY_BYTES) {
    req.resume();
    throw new HttpError(413, 'BODY_TOO_LARGE', '提交内容过长。');
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let done = false;
    const cleanup = () => { req.removeListener('data', onData); req.removeListener('end', onEnd); req.removeListener('aborted', onAbort); req.removeListener('error', onAbort); };
    const fail = error => { if (done) return; done = true; cleanup(); req.resume(); reject(error); };
    const onData = chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) fail(new HttpError(413, 'BODY_TOO_LARGE', '提交内容过长。'));
      else chunks.push(chunk);
    };
    const onEnd = () => {
      if (done) return;
      done = true;
      cleanup();
      try { resolve(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))); }
      catch { reject(new HttpError(400, 'INVALID_JSON', '报名数据格式不正确。')); }
    };
    const onAbort = () => fail(new HttpError(400, 'INCOMPLETE_REQUEST', '提交中断，请重试。'));
    req.on('data', onData); req.on('end', onEnd); req.on('aborted', onAbort); req.on('error', onAbort);
  });
}

class RateLimiter {
  constructor(max, intervalMs) { this.max = max; this.intervalMs = intervalMs; this.entries = new Map(); }
  take(key) {
    const now = Date.now();
    let entry = this.entries.get(key);
    if (!entry || entry.reset <= now) {
      if (this.entries.size >= 10000) {
        for (const [id, item] of this.entries) if (item.reset <= now) this.entries.delete(id);
        if (this.entries.size >= 10000) return 60;
      }
      entry = { count: 0, reset: now + this.intervalMs };
      this.entries.set(key, entry);
    }
    entry.count += 1;
    return entry.count > this.max ? Math.ceil((entry.reset - now) / 1000) : 0;
  }
}

function requestIp(req) {
  // The service binds only to loopback. Nginx MUST overwrite X-Real-IP with $remote_addr.
  const forwarded = req.headers['x-real-ip'];
  return typeof forwarded === 'string' && isIP(forwarded) ? forwarded : req.socket.remoteAddress || 'local';
}

async function authenticated(req, config) {
  const header = req.headers.authorization || '';
  if (header.length > 4096 || !/^Basic [A-Za-z0-9+/]+={0,2}$/i.test(header)) return false;
  let credentials;
  try { credentials = Buffer.from(header.slice(6), 'base64').toString('utf8'); } catch { return false; }
  const split = credentials.indexOf(':');
  if (split < 0) return false;
  const user = Buffer.from(credentials.slice(0, split));
  const expectedUser = Buffer.from(config.adminUser);
  const password = credentials.slice(split + 1);
  if (!password || password.length > 512) return false;
  const [, salt, expected] = config.adminHash.split('$');
  const computed = await scryptAsync(password, Buffer.from(salt, 'hex'), 64);
  return user.length === expectedUser.length && timingSafeEqual(user, expectedUser) && timingSafeEqual(computed, Buffer.from(expected, 'hex'));
}

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}

function adminHtml(store) {
  const rows = store.latest(200).map(row => `<tr><td>${escapeHtml(formatBeijingTime(row.created_at))}</td><td>${escapeHtml(row.name || '未填写')}</td><td>${escapeHtml(row.phone)}</td><td>${escapeHtml(formatCourses(JSON.parse(row.course_ids)))}</td><td>${escapeHtml(SOURCE_NAMES[row.source] || row.source)}</td><td>${escapeHtml(row.registration_id)}</td></tr>`).join('');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>狸有戏 · 报名意向管理</title><style>body{font-family:system-ui,sans-serif;margin:24px;background:#faf8f4;color:#242424}h1{font-size:24px}a{color:#a94114}table{border-collapse:collapse;background:white;width:100%;font-size:14px}th,td{text-align:left;padding:12px;border-bottom:1px solid #ddd;vertical-align:top}th{white-space:nowrap}.table{overflow:auto}p{line-height:1.6}</style></head><body><h1>狸有戏 · 报名意向</h1><p>共 ${store.count()} 条，显示最新 200 条。提交时间均为北京时间（Asia/Shanghai）。</p><p><a href="/liyoxi/admin/export.csv">导出全部报名意向（CSV）</a></p><div class="table"><table><thead><tr><th>提交时间（北京时间）</th><th>称呼</th><th>手机号</th><th>意向课程</th><th>来源</th><th>报名编号</th></tr></thead><tbody>${rows || '<tr><td colspan="6">暂无报名意向</td></tr>'}</tbody></table></div><p>此页仅用于跟进课程咨询。请妥善保管账号及导出文件。需要删除记录时，由服务器管理员使用 CLI 执行。</p></body></html>`;
}

export function createApp(config, store, { logger = console, postLimit = 60, rateWindowMs = 15 * 60 * 1000 } = {}) {
  const posts = new RateLimiter(postLimit, rateWindowMs);
  const admins = new RateLimiter(30, 60 * 1000);
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      const isEnrollment = path === '/liyoxi/api/enrollments';
      if (isEnrollment) {
        const origin = req.headers.origin;
        if (typeof origin !== 'string' || !config.allowedOrigins.has(origin)) throw new HttpError(403, 'ORIGIN_NOT_ALLOWED', '请从狸有戏官方报名页面提交。');
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        if (req.method === 'OPTIONS') {
          res.writeHead(204, { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); res.end(); return;
        }
        if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); throw new HttpError(405, 'METHOD_NOT_ALLOWED', '不支持此请求方式。'); }
        const retryAfter = posts.take(requestIp(req));
        if (retryAfter) { res.setHeader('Retry-After', retryAfter); throw new HttpError(429, 'RATE_LIMITED', '提交过于频繁，请稍后重试或直接添加微信咨询。'); }
        const payload = validateEnrollment(await readJson(req));
        const result = store.save(payload);
        if (result.conflict) throw new HttpError(409, 'REQUEST_CONFLICT', '本次提交编号已用于其他报名内容，请重新提交。');
        json(res, result.created ? 201 : 200, { ok: true, registrationId: result.registrationId, createdAt: result.createdAt });
        return;
      }
      if (path === '/liyoxi/api/health') {
        if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); throw new HttpError(405, 'METHOD_NOT_ALLOWED', '不支持此请求方式。'); }
        store.health(); json(res, 200, { ok: true }); return;
      }
      if (path === '/liyoxi/admin/' || path === '/liyoxi/admin' || path === '/liyoxi/admin/export.csv') {
        const retryAfter = admins.take(requestIp(req));
        if (retryAfter) { res.setHeader('Retry-After', retryAfter); throw new HttpError(429, 'RATE_LIMITED', '请求过于频繁，请稍后重试。'); }
        if (!(await authenticated(req, config))) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Liyoxi enrollments", charset="UTF-8"');
          throw new HttpError(401, 'AUTH_REQUIRED', '请先登录。');
        }
        if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); throw new HttpError(405, 'METHOD_NOT_ALLOWED', '管理后台仅支持查看。'); }
        if (path === '/liyoxi/admin') { res.writeHead(308, { Location: '/liyoxi/admin/' }); res.end(); return; }
        if (path === '/liyoxi/admin/export.csv') {
          res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="liyoxi-enrollments-${new Date().toISOString().slice(0, 10)}.csv"` });
          await pipeline(Readable.from(csvRows(store)), res); return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(adminHtml(store)); return;
      }
      throw new HttpError(404, 'NOT_FOUND', '页面不存在。');
    } catch (error) {
      req.resume();
      if (!(error instanceof HttpError)) logger.error(JSON.stringify({ event: 'liyoxi_request_failed', code: typeof error?.code === 'string' ? error.code : 'INTERNAL_ERROR' }));
      if (res.headersSent) { res.destroy(); return; }
      json(res, error instanceof HttpError ? error.status : 500, { ok: false, error: { code: error instanceof HttpError ? error.code : 'INTERNAL_ERROR', message: error instanceof HttpError ? error.message : '暂时未能保存报名，请稍后重试或添加微信咨询。' } });
    }
  });
}

export async function start(config = configFromEnv()) {
  const store = openStore(config.dbPath);
  const server = createApp(config, store);
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(config.port, '127.0.0.1', resolve); });
  return { server, store };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { server, store } = await start();
    console.info(JSON.stringify({ event: 'liyoxi_started', host: '127.0.0.1', port: server.address().port }));
    let closing = false;
    const close = () => {
      if (closing) return;
      closing = true;
      const timeout = setTimeout(() => process.exit(1), 10000).unref();
      server.close(() => { clearTimeout(timeout); store.close(); process.exit(0); });
    };
    process.on('SIGTERM', close); process.on('SIGINT', close);
  } catch (error) {
    console.error(JSON.stringify({ event: 'liyoxi_start_failed', code: error?.code || 'CONFIG_OR_DATABASE_ERROR' }));
    process.exitCode = 1;
  }
}
