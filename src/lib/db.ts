// SQLite read-only connection via better-sqlite3

import Database from "better-sqlite3";
import { paths } from "./paths";
import type { Job, Stats } from "./types";

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(paths.db, { readonly: true, fileMustExist: true });
    _db.pragma("journal_mode = WAL");
    _db.pragma("busy_timeout = 5000");
  }
  return _db;
}

function getWriteDb(): Database.Database {
  const db = new Database(paths.db, { fileMustExist: true });
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  return db;
}

// --- Stats ---

export function getStats(): Stats {
  const db = getDb();

  const total = (db.prepare("SELECT COUNT(*) as c FROM jobs").get() as { c: number }).c;

  const bySite = db
    .prepare("SELECT site, COUNT(*) as cnt FROM jobs GROUP BY site ORDER BY cnt DESC")
    .all() as { site: string; cnt: number }[];

  const pendingDetail = (
    db.prepare("SELECT COUNT(*) as c FROM jobs WHERE detail_scraped_at IS NULL").get() as { c: number }
  ).c;

  const withDescription = (
    db.prepare("SELECT COUNT(*) as c FROM jobs WHERE full_description IS NOT NULL").get() as { c: number }
  ).c;

  const detailErrors = (
    db.prepare("SELECT COUNT(*) as c FROM jobs WHERE detail_error IS NOT NULL").get() as { c: number }
  ).c;

  const scored = (
    db.prepare("SELECT COUNT(*) as c FROM jobs WHERE fit_score IS NOT NULL").get() as { c: number }
  ).c;

  const unscored = (
    db.prepare(
      "SELECT COUNT(*) as c FROM jobs WHERE full_description IS NOT NULL AND fit_score IS NULL"
    ).get() as { c: number }
  ).c;

  const scoreDist = db
    .prepare(
      "SELECT fit_score, COUNT(*) as cnt FROM jobs WHERE fit_score IS NOT NULL GROUP BY fit_score ORDER BY fit_score DESC"
    )
    .all() as { fit_score: number; cnt: number }[];

  const tailored = (
    db.prepare("SELECT COUNT(*) as c FROM jobs WHERE tailored_resume_path IS NOT NULL").get() as { c: number }
  ).c;

  const untailoredEligible = (
    db.prepare(
      "SELECT COUNT(*) as c FROM jobs WHERE fit_score >= 7 AND full_description IS NOT NULL AND tailored_resume_path IS NULL"
    ).get() as { c: number }
  ).c;

  const tailorExhausted = (
    db.prepare(
      "SELECT COUNT(*) as c FROM jobs WHERE COALESCE(tailor_attempts, 0) >= 5 AND tailored_resume_path IS NULL"
    ).get() as { c: number }
  ).c;

  const withCoverLetter = (
    db.prepare("SELECT COUNT(*) as c FROM jobs WHERE cover_letter_path IS NOT NULL").get() as { c: number }
  ).c;

  const coverExhausted = (
    db.prepare(
      "SELECT COUNT(*) as c FROM jobs WHERE COALESCE(cover_attempts, 0) >= 5 AND (cover_letter_path IS NULL OR cover_letter_path = '')"
    ).get() as { c: number }
  ).c;

  const applied = (
    db.prepare("SELECT COUNT(*) as c FROM jobs WHERE applied_at IS NOT NULL").get() as { c: number }
  ).c;

  const applyErrors = (
    db.prepare("SELECT COUNT(*) as c FROM jobs WHERE apply_error IS NOT NULL").get() as { c: number }
  ).c;

  const readyToApply = (
    db.prepare(
      "SELECT COUNT(*) as c FROM jobs WHERE tailored_resume_path IS NOT NULL AND applied_at IS NULL"
    ).get() as { c: number }
  ).c;

  const appliedJobs = db
    .prepare(
      "SELECT url, title, site, applied_at FROM jobs WHERE applied_at IS NOT NULL ORDER BY applied_at DESC LIMIT 20"
    )
    .all() as { url: string; title: string; site: string; applied_at: string }[];

  return {
    total,
    by_site: bySite.map((r) => [r.site, r.cnt]),
    pending_detail: pendingDetail,
    with_description: withDescription,
    detail_errors: detailErrors,
    scored,
    unscored,
    score_distribution: scoreDist.map((r) => [r.fit_score, r.cnt]),
    tailored,
    untailored_eligible: untailoredEligible,
    tailor_exhausted: tailorExhausted,
    with_cover_letter: withCoverLetter,
    cover_exhausted: coverExhausted,
    applied,
    apply_errors: applyErrors,
    ready_to_apply: readyToApply,
    applied_jobs: appliedJobs,
  };
}

// --- Jobs ---

interface JobQueryParams {
  search?: string;
  min_score?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export function getJobs(params: JobQueryParams = {}): Job[] {
  const db = getDb();
  const conditions: string[] = ["1=1"];
  const values: (string | number)[] = [];

  if (params.search) {
    conditions.push("(title LIKE ? OR site LIKE ? OR location LIKE ?)");
    const q = `%${params.search}%`;
    values.push(q, q, q);
  }

  if (params.min_score !== undefined) {
    conditions.push("fit_score >= ?");
    values.push(params.min_score);
  }

  if (params.status) {
    switch (params.status) {
      case "discovered":
        conditions.push("detail_scraped_at IS NULL");
        break;
      case "enriched":
        conditions.push("full_description IS NOT NULL AND fit_score IS NULL");
        break;
      case "scored":
        conditions.push("fit_score IS NOT NULL AND tailored_resume_path IS NULL");
        break;
      case "tailored":
        conditions.push("tailored_resume_path IS NOT NULL AND applied_at IS NULL");
        break;
      case "ready":
        conditions.push(
          "tailored_resume_path IS NOT NULL AND applied_at IS NULL AND (apply_status IS NULL OR apply_status NOT IN ('in_progress', 'pending_verification'))"
        );
        break;
      case "applied":
        conditions.push("applied_at IS NOT NULL");
        break;
      case "failed":
        conditions.push("apply_error IS NOT NULL AND apply_status != 'pending_verification'");
        break;
      case "pending_verification":
        conditions.push("apply_status = 'pending_verification'");
        break;
    }
  }

  const limit = params.limit || 100;
  const offset = params.offset || 0;

  const sql = `SELECT * FROM jobs WHERE ${conditions.join(" AND ")} ORDER BY fit_score DESC NULLS LAST, discovered_at DESC LIMIT ? OFFSET ?`;
  values.push(limit, offset);

  return db.prepare(sql).all(...values) as Job[];
}

export function getJob(url: string): Job | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM jobs WHERE url = ?").get(url) as Job | undefined;
}

export function insertJob(url: string, title?: string, location?: string, description?: string, site?: string): boolean {
  const db = getWriteDb();
  try {
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO jobs (url, title, location, description, site, strategy, discovered_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(url, title || "Unknown Role", location || "", description || `Manually added job.`, site || "manual", "web-ui", now);
    db.close();
    return true;
  } catch {
    db.close();
    return false;
  }
}

export function updateJob(url: string, updates: Partial<Pick<Job, "apply_status" | "apply_error" | "applied_at">>): boolean {
  const db = getWriteDb();
  try {
    const sets: string[] = [];
    const values: (string | null)[] = [];
    for (const [key, val] of Object.entries(updates)) {
      sets.push(`${key} = ?`);
      values.push(val as string | null);
    }
    values.push(url);
    db.prepare(`UPDATE jobs SET ${sets.join(", ")} WHERE url = ?`).run(...values);
    db.close();
    return true;
  } catch {
    db.close();
    return false;
  }
}

// --- Pipeline status ---

export function getPipelineStatus(minScore = 7): Record<string, number> {
  const db = getDb();

  const pending_enrich = (db.prepare("SELECT COUNT(*) as c FROM jobs WHERE detail_scraped_at IS NULL").get() as { c: number }).c;
  const pending_score = (db.prepare("SELECT COUNT(*) as c FROM jobs WHERE full_description IS NOT NULL AND fit_score IS NULL").get() as { c: number }).c;
  const pending_tailor = (db.prepare("SELECT COUNT(*) as c FROM jobs WHERE fit_score >= ? AND full_description IS NOT NULL AND tailored_resume_path IS NULL AND COALESCE(tailor_attempts, 0) < 5").get(minScore) as { c: number }).c;
  const pending_cover = (db.prepare("SELECT COUNT(*) as c FROM jobs WHERE tailored_resume_path IS NOT NULL AND (cover_letter_path IS NULL OR cover_letter_path = '') AND COALESCE(cover_attempts, 0) < 5").get() as { c: number }).c;
  const pending_pdf = (db.prepare("SELECT COUNT(*) as c FROM jobs WHERE tailored_resume_path IS NOT NULL AND tailored_resume_path LIKE '%.txt'").get() as { c: number }).c;

  return {
    discover: 0,
    enrich: pending_enrich,
    score: pending_score,
    tailor: pending_tailor,
    cover: pending_cover,
    pdf: pending_pdf,
  };
}

// Invalidate cached read-only db on writes
export function invalidateCache() {
  if (_db) {
    _db.close();
    _db = null;
  }
}
