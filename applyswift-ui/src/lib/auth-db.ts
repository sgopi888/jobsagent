// Auth database — matches server schema at /opt/applyswift/data/auth.db

import Database from "better-sqlite3";
import { randomBytes, randomUUID } from "crypto";
import { paths } from "./paths";

let _db: Database.Database | null = null;

function getAuthDb(): Database.Database {
  if (!_db) {
    _db = new Database(paths.authDb);
    _db.pragma("journal_mode = WAL");
    _db.pragma("busy_timeout = 5000");
    _db.pragma("foreign_keys = ON");
    migrate(_db);
  }
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users(
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      google_sub TEXT,
      display_name TEXT,
      data_dir TEXT,
      storage_quota_mb INTEGER DEFAULT 1024
    );
    CREATE TABLE IF NOT EXISTS sessions(
      token TEXT PRIMARY KEY,
      user_id TEXT,
      expires_at INTEGER,
      is_revoked INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS oauth_state(
      state TEXT PRIMARY KEY,
      created_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);
}

// --- Users ---

export interface AuthUser {
  id: string;
  email: string;
  google_sub: string | null;
  display_name: string | null;
  data_dir: string | null;
  storage_quota_mb: number;
}

export function upsertGoogleUser(googleSub: string, email: string, displayName: string): AuthUser {
  const db = getAuthDb();

  // Check if user exists by google_sub
  let user = db.prepare("SELECT * FROM users WHERE google_sub = ?").get(googleSub) as AuthUser | undefined;
  if (user) {
    db.prepare("UPDATE users SET email = ?, display_name = ? WHERE google_sub = ?")
      .run(email, displayName, googleSub);
    return { ...user, email, display_name: displayName };
  }

  // Check if user exists by email (merge: password user now signing in with Google)
  user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as AuthUser | undefined;
  if (user) {
    db.prepare("UPDATE users SET google_sub = ?, display_name = ? WHERE email = ?")
      .run(googleSub, displayName, email);
    return { ...user, google_sub: googleSub, display_name: displayName };
  }

  // New user
  const id = `usr_${randomUUID()}`;
  const dataDir = `${paths.appDir}/users/${id}`;
  db.prepare(
    "INSERT INTO users (id, email, google_sub, display_name, data_dir, storage_quota_mb) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, email, googleSub, displayName, dataDir, 1024);

  return { id, email, google_sub: googleSub, display_name: displayName, data_dir: dataDir, storage_quota_mb: 1024 };
}

// --- Sessions ---

export function createSession(userId: string): string {
  const db = getAuthDb();
  const token = randomBytes(32).toString("hex");
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
  db.prepare("INSERT INTO sessions (token, user_id, expires_at, is_revoked) VALUES (?, ?, ?, 0)")
    .run(token, userId, expiresAt);
  return token;
}

export function getSessionUser(token: string): AuthUser | null {
  const db = getAuthDb();
  const now = Math.floor(Date.now() / 1000);
  const row = db.prepare(`
    SELECT u.* FROM users u
    JOIN sessions s ON s.user_id = u.id
    WHERE s.token = ? AND s.is_revoked = 0 AND s.expires_at > ?
  `).get(token, now) as AuthUser | undefined;
  return row ?? null;
}

export function deleteSession(token: string) {
  const db = getAuthDb();
  db.prepare("UPDATE sessions SET is_revoked = 1 WHERE token = ?").run(token);
}

// --- OAuth State (CSRF) ---

export function createOAuthState(): string {
  const db = getAuthDb();
  const state = randomBytes(16).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  // Clean up old states (> 10 min)
  db.prepare("DELETE FROM oauth_state WHERE created_at < ?").run(now - 600);
  db.prepare("INSERT INTO oauth_state (state, created_at) VALUES (?, ?)").run(state, now);
  return state;
}

export function verifyOAuthState(state: string): boolean {
  const db = getAuthDb();
  const now = Math.floor(Date.now() / 1000);
  const row = db.prepare("SELECT * FROM oauth_state WHERE state = ? AND created_at > ?")
    .get(state, now - 600);
  if (row) {
    db.prepare("DELETE FROM oauth_state WHERE state = ?").run(state);
    return true;
  }
  return false;
}
