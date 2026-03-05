import { NextRequest } from "next/server";
import { spawnCli } from "@/lib/cli";
import { sseResponse } from "@/lib/sse";

export const dynamic = "force-dynamic";

// Submit a verification code to complete a pending application.
// The code is passed to applypilot which re-launches Claude on the open browser.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, code } = body;
    if (!url || !code) {
      return new Response(JSON.stringify({ error: "url and code are required" }), { status: 400 });
    }

    // applypilot verify <url> <code>
    const args = ["verify", url, code];
    const proc = spawnCli(args);
    return sseResponse(proc);
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
