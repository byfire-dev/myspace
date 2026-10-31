import { DatabaseSync } from 'node:sqlite';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { formatBeijingTime, formatCourses, SOURCE_NAMES } from './constants.mjs';

export const DEFAULT_DB_PATH = '/var/lib/liyoxi/enrollments.sqlite';

export function payloadHash(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function openStore(path = DEFAULT_DB_PATH, { readOnly = false } = {}) {
  if (!readOnly && path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path, { readOnly });
  db.exec('PRAGMA busy_timeout = 5000');
  if (!readOnly) {
    db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = FULL;
      CREATE TABLE IF NOT EXISTS enrollments (
        registration_id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL UNIQUE,
        payload_hash TEXT NOT NULL,
        phone TEXT NOT NULL,
        name TEXT NOT NULL,
        course_ids TEXT NOT NULL,
        source TEXT NOT NULL,
        consent_version TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS enrollments_created_at ON enrollments(created_at DESC);
      PRAGMA user_version = 1;
    `);
    if (path !== ':memory:' && process.platform !== 'win32') chmodSync(path, 0o600);
  }
  const findRequest = db.prepare('SELECT registration_id, payload_hash, created_at FROM enrollments WHERE request_id = ?');
  const insert = readOnly ? null : db.prepare(`INSERT INTO enrollments
    (registration_id, request_id, payload_hash, phone, name, course_ids, source, consent_version, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  return {
    find(requestId) { return findRequest.get(requestId); },
    save(payload) {
      const hash = payloadHash(payload);
      const previous = findRequest.get(payload.requestId);
      if (previous) return { conflict: previous.payload_hash !== hash, created: false, registrationId: previous.registration_id, createdAt: previous.created_at };
      const registrationId = randomUUID();
      const createdAt = new Date().toISOString();
      insert.run(registrationId, payload.requestId, hash, payload.phone, payload.name, JSON.stringify(payload.courseIds), payload.source, 'liyoxi-contact-v1', createdAt);
      return { conflict: false, created: true, registrationId, createdAt };
    },
    latest(limit = 200) {
      return db.prepare('SELECT registration_id, phone, name, course_ids, source, created_at FROM enrollments ORDER BY created_at DESC LIMIT ?').all(limit);
    },
    rows() {
      return db.prepare('SELECT registration_id, phone, name, course_ids, source, created_at FROM enrollments ORDER BY created_at DESC').iterate();
    },
    count() { return db.prepare('SELECT count(*) AS count FROM enrollments').get().count; },
    delete(registrationId) {
      return db.prepare('DELETE FROM enrollments WHERE registration_id = ?').run(registrationId).changes;
    },
    health() { db.prepare('SELECT 1').get(); },
    close() { db.close(); },
  };
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text) || /^[\t\r\n]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function* csvRows(store) {
  yield '\ufeff' + ['报名编号', '提交时间（北京时间）', '手机号', '称呼', '意向课程', '来源'].map(csvCell).join(',') + '\r\n';
  for (const row of store.rows()) {
    yield [row.registration_id, formatBeijingTime(row.created_at), row.phone, row.name, formatCourses(JSON.parse(row.course_ids)), SOURCE_NAMES[row.source] || row.source].map(csvCell).join(',') + '\r\n';
  }
}
