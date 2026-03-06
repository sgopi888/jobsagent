import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { paths } from "@/lib/paths";

export const dynamic = "force-dynamic";

const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".text", ".docx", ".doc", ".rtf"];

// ─── PDF extraction via pdfjs-dist legacy build (no canvas needed) ───

async function extractPdfText(buffer: Buffer): Promise<string> {
  const g = globalThis as Record<string, unknown>;
  if (!g.DOMMatrix) {
    g.DOMMatrix = class DOMMatrix {
      a=1; b=0; c=0; d=1; e=0; f=0;
      constructor(init?: number[]) {
        if (init && init.length >= 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }
      static fromFloat32Array(a: Float32Array) { return new DOMMatrix(Array.from(a)); }
      static fromFloat64Array(a: Float64Array) { return new DOMMatrix(Array.from(a)); }
      static fromMatrix() { return new DOMMatrix(); }
    } as unknown as typeof globalThis.DOMMatrix;
  }
  if (!g.Path2D) g.Path2D = class Path2D {} as unknown as typeof globalThis.Path2D;
  if (!g.ImageData) {
    g.ImageData = class ImageData {
      width: number; height: number; data: Uint8ClampedArray;
      constructor(w: number, h: number) {
        this.width = w; this.height = h;
        this.data = new Uint8ClampedArray(w * h * 4);
      }
    } as unknown as typeof globalThis.ImageData;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .filter((item: { str?: string }) => typeof item.str === "string")
      .map((item: { str: string }) => item.str)
      .join(" ");
    pages.push(text);
  }
  return pages.join("\n");
}

// ─── DOCX extraction via mammoth ───

async function extractDocxText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value as string;
}

// ─── RTF: strip RTF control words, extract plain text ───

function extractRtfText(buffer: Buffer): string {
  const rtf = buffer.toString("utf-8");
  let text = rtf
    .replace(/\\par[d]?\s*/g, "\n")        // paragraph breaks
    .replace(/\{\\[^{}]*\}/g, "")           // remove groups like {\fonttbl...}
    .replace(/\\[a-z]+[-]?\d*\s?/gi, "")    // remove control words
    .replace(/[{}]/g, "")                    // remove remaining braces
    .replace(/\r\n/g, "\n");
  // Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

// ─── Route handler ───

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save the original file (PDF saved separately for apply agent uploads)
    mkdirSync(dirname(paths.resumePdf), { recursive: true });
    if (ext === ".pdf") {
      writeFileSync(paths.resumePdf, buffer);
    }

    // Extract text based on format
    let text: string;
    if (ext === ".pdf") {
      text = await extractPdfText(buffer);
    } else if (ext === ".docx") {
      text = await extractDocxText(buffer);
    } else if (ext === ".doc") {
      // .doc (old binary format) — try mammoth (works for some .doc files)
      // Falls back to raw text extraction if mammoth fails
      try {
        text = await extractDocxText(buffer);
      } catch {
        text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
      }
    } else if (ext === ".rtf") {
      text = extractRtfText(buffer);
    } else {
      // .txt, .text — plain text
      text = buffer.toString("utf-8");
    }

    // Clean up: collapse excessive whitespace / blank lines
    const cleaned = text
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((_, i, arr) => {
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
    console.error("Resume upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
