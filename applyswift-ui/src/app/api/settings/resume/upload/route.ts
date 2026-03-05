import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { paths } from "@/lib/paths";

export const dynamic = "force-dynamic";

// pdf-parse works server-side only (Node.js). Import here so it's never
// bundled into the client. Uses a dynamic require to avoid Next.js
// edge-runtime issues.
async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text as string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    // Read the uploaded file into a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save the PDF to ~/.applypilot/resume.pdf (used by apply agent for uploads)
    mkdirSync(dirname(paths.resumePdf), { recursive: true });
    writeFileSync(paths.resumePdf, buffer);

    // Extract plain text from the PDF
    const text = await extractPdfText(buffer);

    // Clean up: collapse excessive whitespace / blank lines
    const cleaned = text
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((_, i, arr) => {
        // Keep non-empty lines; collapse runs of 3+ blank lines to 2
        if (arr[i].trim()) return true;
        const prevBlank = i > 0 && !arr[i - 1].trim();
        const prevPrevBlank = i > 1 && !arr[i - 2].trim();
        return !(prevBlank && prevPrevBlank);
      })
      .join("\n")
      .trim();

    // Save extracted text to ~/.applypilot/resume.txt
    writeFileSync(paths.resume, cleaned, "utf-8");

    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      success: true,
      content: cleaned,
      wordCount,
      filename: file.name,
    });
  } catch (err) {
    console.error("PDF upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
