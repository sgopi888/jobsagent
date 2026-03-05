import { NextRequest, NextResponse } from "next/server";
import { getPipelineStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const minScore = Number(req.nextUrl.searchParams.get("min_score") ?? 7);
    const status = getPipelineStatus(minScore);
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
