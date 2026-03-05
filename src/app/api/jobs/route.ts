import { NextRequest, NextResponse } from "next/server";
import { getJobs, insertJob, invalidateCache } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const jobs = getJobs({
      search: sp.get("search") || undefined,
      min_score: sp.has("min_score") ? Number(sp.get("min_score")) : undefined,
      status: sp.get("status") || undefined,
      limit: sp.has("limit") ? Number(sp.get("limit")) : 100,
      offset: sp.has("offset") ? Number(sp.get("offset")) : 0,
    });
    return NextResponse.json(jobs);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, title, location, description, site } = body;
    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }
    invalidateCache();
    const inserted = insertJob(url, title, location, description, site);
    if (!inserted) {
      return NextResponse.json({ error: "Job already exists" }, { status: 409 });
    }
    invalidateCache();
    return NextResponse.json({ success: true, url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
