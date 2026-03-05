import { NextResponse } from "next/server";
import { runCli } from "@/lib/cli";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await runCli(["doctor"]);
    const lines = result.stdout.split("\n").filter(Boolean);

    const checks = lines.map((line) => {
      const okMatch = line.match(/OK\s*[:\-]\s*(.+)/i);
      const missMatch = line.match(/MISSING\s*[:\-]\s*(.+)/i);
      const warnMatch = line.match(/WARN\s*[:\-]\s*(.+)/i);

      if (okMatch) return { name: okMatch[1].trim(), status: "ok" as const, message: line.trim() };
      if (missMatch) return { name: missMatch[1].trim(), status: "missing" as const, message: line.trim() };
      if (warnMatch) return { name: warnMatch[1].trim(), status: "warn" as const, message: line.trim() };
      return { name: line.trim(), status: "ok" as const, message: line.trim() };
    });

    return NextResponse.json({ checks, exitCode: result.exitCode, raw: result.stdout });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
