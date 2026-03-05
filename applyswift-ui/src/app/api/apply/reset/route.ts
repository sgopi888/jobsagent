import { spawnCli } from "@/lib/cli";
import { sseResponse } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const proc = spawnCli(["apply", "--reset-failed"]);
    return sseResponse(proc);
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
