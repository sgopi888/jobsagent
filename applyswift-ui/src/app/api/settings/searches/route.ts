import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import yaml from "js-yaml";
import { paths } from "@/lib/paths";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!existsSync(paths.searches)) {
      return NextResponse.json({});
    }
    const content = readFileSync(paths.searches, "utf-8");
    const data = yaml.load(content);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const yamlStr = yaml.dump(body, { lineWidth: -1 });
    writeFileSync(paths.searches, yamlStr, "utf-8");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
