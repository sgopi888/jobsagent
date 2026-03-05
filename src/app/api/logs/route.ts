import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { paths } from "@/lib/paths";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const file = req.nextUrl.searchParams.get("file");

    if (!existsSync(paths.logDir)) {
      return NextResponse.json({ files: [], content: "" });
    }

    if (file) {
      const filePath = join(paths.logDir, file);
      if (!filePath.startsWith(paths.logDir)) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      }
      if (!existsSync(filePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      const content = readFileSync(filePath, "utf-8");
      // Return last 500 lines
      const lines = content.split("\n");
      const tail = lines.slice(-500).join("\n");
      return NextResponse.json({ content: tail });
    }

    const files = readdirSync(paths.logDir)
      .filter((f) => f.endsWith(".log"))
      .sort()
      .reverse()
      .slice(0, 20);

    return NextResponse.json({ files });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
