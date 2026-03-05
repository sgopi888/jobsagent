import { NextRequest } from "next/server";
import { spawnCli } from "@/lib/cli";
import { sseResponse } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const stages: string[] = body.stages || ["all"];
    const minScore = body.min_score ?? 7;
    const validationMode = body.validation_mode ?? "normal";

    const args = ["run", ...stages, "--min-score", String(minScore), "--validation", validationMode];

    if (body.stream) args.push("--stream");

    const proc = spawnCli(args);
    return sseResponse(proc);
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
