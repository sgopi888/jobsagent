import { NextRequest } from "next/server";
import { spawnCli } from "@/lib/cli";
import { sseResponse } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;
    if (!url) {
      return new Response(JSON.stringify({ error: "url is required" }), { status: 400 });
    }

    const args = ["url", url];
    if (body.dry_run) args.push("--dry-run");

    const proc = spawnCli(args);
    return sseResponse(proc);
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
