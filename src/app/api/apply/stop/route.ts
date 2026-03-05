import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import Database from "better-sqlite3";
import { paths } from "@/lib/paths";

const execAsync = promisify(exec);

/** Reset any in_progress jobs to failed so they re-enter the queue or show in failed list */
function releaseStuckJobs() {
  try {
    const db = new Database(paths.db, { fileMustExist: true });
    db.pragma("journal_mode = WAL");
    db.prepare(
      `UPDATE jobs SET apply_status = 'failed', apply_error = 'stopped_by_user',
       apply_attempts = COALESCE(apply_attempts, 0) + 1
       WHERE apply_status = 'in_progress'`
    ).run();
    db.close();
  } catch { /* DB may not exist yet */ }
}

export const dynamic = "force-dynamic";

/**
 * POST /api/apply/stop
 *
 * Kills any running applypilot apply process.
 * The UI's useSSE hook aborts the SSE stream on the client side,
 * but the server-side subprocess keeps running. This endpoint kills it.
 *
 * Uses SIGTERM first (graceful), then SIGKILL after 2s if still running.
 */
export async function POST() {
  try {
    // Find and kill any running applypilot apply/url processes
    await execAsync("pkill -SIGTERM -f 'applypilot (apply|url|verify)' || true");

    // Give it 2 seconds to exit gracefully, then force kill
    await new Promise(r => setTimeout(r, 2000));
    await execAsync("pkill -SIGKILL -f 'applypilot (apply|url|verify)' || true");

    // Also kill any Claude Code agents launched by applypilot
    await execAsync("pkill -SIGTERM -f 'claude.*--mcp-config.*mcp-apply' || true");

    // Mark any stuck in_progress jobs as failed so they appear in the failed list
    releaseStuckJobs();

    return NextResponse.json({ success: true, message: "Agent stopped" });
  } catch (err) {
    // pkill exits with code 1 if no process found — that's OK
    return NextResponse.json({ success: true, message: "No agent running", detail: String(err) });
  }
}
