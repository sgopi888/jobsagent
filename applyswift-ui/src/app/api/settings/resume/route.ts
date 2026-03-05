import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { paths } from "@/lib/paths";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!existsSync(paths.resume)) {
      return NextResponse.json({ content: "" });
    }
    const content = readFileSync(paths.resume, "utf-8");
    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    writeFileSync(paths.resume, body.content, "utf-8");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
