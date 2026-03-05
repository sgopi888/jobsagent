import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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

    return NextResponse.json({ success: true, message: "Agent stopped" });
  } catch (err) {
    // pkill exits with code 1 if no process found — that's OK
    return NextResponse.json({ success: true, message: "No agent running", detail: String(err) });
  }
}
