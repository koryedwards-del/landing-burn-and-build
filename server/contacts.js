import Database from 'better-sqlite3';
import { countPrograms, getLatestProgram, getLatestProgramMeta, getLatestPaidProgramMeta, getProgramById, isProgramPaid, normalizeEmail } from './db.js';
import { prepareDatabasePath, resolveDatabasePath } from './dbPath.js';

const dbPath = resolveDatabasePath();
prepareDatabasePath(dbPath);
const db = new Database(dbPath);

function createContactsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      email TEXT PRIMARY KEY,
      display_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

/** Ensure a contact row exists for every program email — never auto-grants paid access. */
function backfillContactsFromPrograms() {
  const rows = db.prepare('SELECT DISTINCT email FROM programs').all();
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO contacts (email, display_name, created_at, updated_at)
    VALUES (?, NULL, ?, ?)
    ON CONFLICT(email) DO UPDATE SET updated_at = excluded.updated_at
  `);

  for (const row of rows) {
    upsert.run(normalizeEmail(row.email), now, now);
  }
}

createContactsTable();
backfillContactsFromPrograms();

function rowToContact(row) {
  if (!row) return null;
  return {
    email: row.email,
    displayName: row.display_name || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    programCount: countPrograms(row.email),
    programPaid: !!getLatestPaidProgramMeta(row.email),
  };
}

export function getContact(email) {
  const row = db.prepare('SELECT * FROM contacts WHERE email = ?').get(normalizeEmail(email));
  return rowToContact(row);
}

export function listContacts() {
  const rows = db.prepare('SELECT * FROM contacts ORDER BY updated_at DESC, email ASC').all();
  return rows.map(rowToContact);
}

export function upsertContact({ email, displayName }) {
  const key = normalizeEmail(email);
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT email FROM contacts WHERE email = ?').get(key);

  if (existing) {
    db.prepare(`
      UPDATE contacts
      SET display_name = COALESCE(?, display_name),
          updated_at = ?
      WHERE email = ?
    `).run(displayName ?? null, now, key);
  } else {
    db.prepare(`
      INSERT INTO contacts (email, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(key, displayName || null, now, now);
  }

  return getContact(key);
}

/** Diet creation adds or updates contact; access unlocks after payment. */
export function enrollContactFromProgramCreation(email, displayName) {
  const name = String(displayName || '').trim();
  return upsertContact({
    email,
    displayName: name || undefined,
  });
}

export function resolveProgramLoad(email, { getLatestProgram: getLatest, countPrograms: count }) {
  const key = normalizeEmail(email);
  const paidMeta = getLatestPaidProgramMeta(key);
  if (paidMeta) {
    const pkg = getProgramById(key, paidMeta.id);
    if (pkg) {
      return { ok: true, package: pkg, programCount: count(key), programId: paidMeta.id };
    }
  }

  const meta = getLatestProgramMeta(key);
  if (!meta) {
    return { ok: false, status: 404, message: 'No diet saved for this email yet.' };
  }

  if (!isProgramPaid(key, meta.id)) {
    return {
      ok: false,
      status: 403,
      saved: true,
      message: 'Complete Stripe checkout to unlock this program.',
      programCount: count(key),
      programId: meta.id,
    };
  }

  const pkg = getLatest(key);
  if (!pkg) {
    return { ok: false, status: 404, message: 'No diet saved for this email yet.' };
  }

  return { ok: true, package: pkg, programCount: count(key), programId: meta.id };
}

export function deleteContact(email) {
  const key = normalizeEmail(email);
  const result = db.prepare('DELETE FROM contacts WHERE email = ?').run(key);
  return result.changes > 0;
}
