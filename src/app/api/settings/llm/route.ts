import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { paths } from "@/lib/paths";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Model options — mirrors config.py LLM_DEFAULTS exactly.
// Single source of truth on the UI side. Change here → propagates everywhere.
// ---------------------------------------------------------------------------
export const LLM_PROVIDERS = {
  gemini: {
    name: "Google Gemini",
    env_key: "GEMINI_API_KEY",
    default_model: "gemini-2.5-flash-lite",   // verified working; 2.0-flash-lite deprecated for new keys
    models: [
      { id: "gemini-2.5-flash-lite",  label: "Gemini 2.5 Flash Lite (default, free, fast)" },
      { id: "gemini-flash-lite-latest", label: "Gemini Flash Lite Latest (alias)" },
      { id: "gemini-2.5-flash",       label: "Gemini 2.5 Flash (smarter)" },
      { id: "gemini-2.0-flash-lite-001", label: "Gemini 2.0 Flash Lite 001 (stable pin)" },
    ],
  },
  openai: {
    name: "OpenAI",
    env_key: "OPENAI_API_KEY",
    default_model: "gpt-4o-mini",
    models: [
      { id: "gpt-4o-mini",  label: "GPT-4o Mini (default, cheap)" },
      { id: "gpt-4o",       label: "GPT-4o (smarter)" },
      { id: "gpt-4.1-nano", label: "GPT-4.1 Nano (cheapest)" },
    ],
  },
  ollama: {
    name: "Ollama (Local)",
    env_key: "LLM_URL",
    default_model: "gemma3:latest",
    models: [
      { id: "gemma3:latest",       label: "Gemma 3 (recommended local)" },
      { id: "llama3.2:latest",     label: "Llama 3.2" },
      { id: "qwen3:latest",        label: "Qwen 3" },
      { id: "mistral:latest",      label: "Mistral 7B" },
    ],
  },
} as const;

// ---------------------------------------------------------------------------
// Parse / serialize ~/.applypilot/.env
// ---------------------------------------------------------------------------

function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

function serializeEnv(data: Record<string, string>): string {
  const lines = [
    "# ApplyPilot Environment — managed by ApplySwift UI",
    "# Do not set LLM_MODEL unless overriding the provider default",
    "",
  ];
  for (const [k, v] of Object.entries(data)) {
    lines.push(`${k}=${v}`);
  }
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// GET — return current config (masked keys) + available model lists
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const env: Record<string, string> = existsSync(paths.env)
      ? parseEnv(readFileSync(paths.env, "utf-8"))
      : {};

    const active_model = env.LLM_MODEL || null;

    return NextResponse.json({
      // Which providers are configured
      providers: {
        gemini: {
          configured: !!env.GEMINI_API_KEY,
          api_key_hint: env.GEMINI_API_KEY ? `***${env.GEMINI_API_KEY.slice(-4)}` : "",
          default_model: LLM_PROVIDERS.gemini.default_model,
          models: LLM_PROVIDERS.gemini.models,
        },
        openai: {
          configured: !!env.OPENAI_API_KEY,
          api_key_hint: env.OPENAI_API_KEY ? `***${env.OPENAI_API_KEY.slice(-4)}` : "",
          default_model: LLM_PROVIDERS.openai.default_model,
          models: LLM_PROVIDERS.openai.models,
        },
        ollama: {
          configured: !!env.LLM_URL,
          base_url: env.LLM_URL || LLM_PROVIDERS.ollama.default_model,
          default_model: LLM_PROVIDERS.ollama.default_model,
          models: LLM_PROVIDERS.ollama.models,
        },
      },
      // Currently active model override (null = use provider default)
      active_model,
      // Which provider is active (first one with a key)
      active_provider: env.LLM_URL
        ? "ollama"
        : env.OPENAI_API_KEY
        ? "openai"
        : env.GEMINI_API_KEY
        ? "gemini"
        : null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — save API keys, model selection, Ollama URL
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const env: Record<string, string> = existsSync(paths.env)
      ? parseEnv(readFileSync(paths.env, "utf-8"))
      : {};

    // API keys
    if (body.gemini_api_key !== undefined) {
      if (body.gemini_api_key) env.GEMINI_API_KEY = body.gemini_api_key;
      else delete env.GEMINI_API_KEY;
    }
    if (body.openai_api_key !== undefined) {
      if (body.openai_api_key) env.OPENAI_API_KEY = body.openai_api_key;
      else delete env.OPENAI_API_KEY;
    }

    // Ollama URL — setting this activates local mode
    if (body.llm_url !== undefined) {
      if (body.llm_url) env.LLM_URL = body.llm_url;
      else delete env.LLM_URL;
    }

    // Model override — only set when explicitly chosen, remove to use provider default
    if (body.llm_model !== undefined) {
      if (body.llm_model) env.LLM_MODEL = body.llm_model;
      else delete env.LLM_MODEL;  // blank = use provider default (gemini-2.0-flash-lite etc.)
    }

    // Capsolver key
    if (body.capsolver_api_key !== undefined) {
      if (body.capsolver_api_key) env.CAPSOLVER_API_KEY = body.capsolver_api_key;
      else delete env.CAPSOLVER_API_KEY;
    }

    mkdirSync(dirname(paths.env), { recursive: true });
    writeFileSync(paths.env, serializeEnv(env), "utf-8");

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
