import { NextRequest } from "next/server";
import { spawnCli } from "@/lib/cli";
import { sseResponse } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = body.limit ?? 1;
    // No --headless: Chrome must be visible for the agent to work
    const args = ["apply", "--limit", String(limit)];
    if (body.dry_run) args.push("--dry-run");

    const proc = spawnCli(args);
    return sseResponse(proc);
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
