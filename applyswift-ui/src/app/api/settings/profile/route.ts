import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { paths } from "@/lib/paths";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!existsSync(paths.profile)) {
      return NextResponse.json({}, { status: 200 });
    }
    const data = JSON.parse(readFileSync(paths.profile, "utf-8"));
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    writeFileSync(paths.profile, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
