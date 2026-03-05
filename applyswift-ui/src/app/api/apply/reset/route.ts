import { NextResponse } from "next/server";
import { spawnCli } from "@/lib/cli";
import Database from "better-sqlite3";
import { paths } from "@/lib/paths";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // 1. Release any in_progress jobs stuck from a previous crashed session
    try {
      const db = new Database(paths.db, { fileMustExist: true });
      db.pragma("journal_mode = WAL");
      const stuck = db.prepare(
        `UPDATE jobs SET apply_status = 'failed', apply_error = 'session_interrupted',
         apply_attempts = COALESCE(apply_attempts, 0) + 1
         WHERE apply_status = 'in_progress'`
      ).run();
      if (stuck.changes > 0) console.log(`[reset] Released ${stuck.changes} stuck in_progress jobs`);
      db.close();
    } catch { /* ignore if DB not ready */ }

    // 2. Run applypilot apply --reset-failed to reset non-permanent failed jobs
    const proc = spawnCli(["apply", "--reset-failed"]);

    // Collect output and return as JSON (not SSE — this is a quick operation)
    const lines: string[] = [];
    proc.stdout?.on("data", (d: Buffer) => lines.push(d.toString()));
    proc.stderr?.on("data", (d: Buffer) => lines.push(d.toString()));
    await new Promise<void>((resolve) => proc.on("close", () => resolve()));

    return NextResponse.json({ success: true, output: lines.join("").trim() });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
