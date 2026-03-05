"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User, FileText, Search, Cpu, Key, CheckCircle, AlertCircle, Loader2, Save } from "lucide-react";
import Header from "@/components/layout/Header";
import StatusPill from "@/components/shared/StatusPill";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "resume", label: "Resume", icon: FileText },
  { id: "searches", label: "Search Config", icon: Search },
  { id: "llm", label: "AI Models", icon: Key },
  { id: "system", label: "System", icon: Cpu },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");

  return (
    <div className="max-w-5xl mx-auto">
      <Header title="Settings" subtitle="Configure your pipeline" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-700/50 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? "bg-slate-800/80 text-cyan-400 border-b-2 border-cyan-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "profile" && <ProfileTab />}
      {tab === "resume" && <ResumeTab />}
      {tab === "searches" && <SearchesTab />}
      {tab === "llm" && <LLMTab />}
      {tab === "system" && <SystemTab />}
    </div>
  );
}

// ============ PROFILE TAB ============
function ProfileTab() {
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/profile").then((r) => r.json()).then(setProfile);
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateField = (key: string, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const fields = [
    { key: "name", label: "Full Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "work_authorization", label: "Work Authorization" },
  ];

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-xs font-medium text-slate-400 uppercase mb-1 block">{f.label}</label>
            <input
              value={String(profile[f.key] || "")}
              onChange={(e) => updateField(f.key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-slate-400 uppercase mb-1 block">Skills (comma separated)</label>
        <input
          value={Array.isArray(profile.skills) ? (profile.skills as string[]).join(", ") : String(profile.skills || "")}
          onChange={(e) => setProfile((prev) => ({ ...prev, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          placeholder="Python, React, AWS..."
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </button>
        {saved && <span className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Saved</span>}
      </div>
    </div>
  );
}

// ============ RESUME TAB ============
function ResumeTab() {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/resume").then((r) => r.json()).then((d) => setContent(d.content || ""));
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings/resume", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={20}
        className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-y"
        placeholder="Paste your resume text here..."
      />
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Resume
        </button>
        {saved && <span className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Saved</span>}
      </div>
    </div>
  );
}

// ============ SEARCHES TAB ============
// Searches config typed from searches.yaml structure
interface QueryEntry { query: string; tier?: number }
interface SearchesConfig {
  queries?: (string | QueryEntry)[];
  locations?: (string | { label?: string; location?: string; remote?: boolean })[];
  sites?: string[];
  tiers?: number[];
  enable_workday?: boolean;
  enable_smartextract?: boolean;
  defaults?: { results_per_site?: number; hours_old?: number; country_indeed?: string };
  location_accept?: string[];
  location_reject?: string[];
  location_reject_non_remote?: string[];
  exclude_titles?: string[];
}

const ALL_PLATFORMS = [
  { id: "indeed", label: "Indeed", color: "#003A9B" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2" },
  { id: "glassdoor", label: "Glassdoor", color: "#0CAA41" },
  { id: "dice", label: "Dice", color: "#E5432C" },
  { id: "zip_recruiter", label: "ZipRecruiter", color: "#34D05C" },
  { id: "google", label: "Google Jobs", color: "#4285F4" },
];

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

function SearchesTab() {
  const [config, setConfig] = useState<SearchesConfig>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/searches").then((r) => r.json()).then((d: SearchesConfig) => setConfig(d || {}));
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings/searches", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Helpers
  const sites = config.sites ?? [];
  const tiers = config.tiers ?? [1, 2, 3];
  const defaults = config.defaults ?? {};

  // Queries: normalize to string array for display
  const queryStrings = (config.queries ?? []).map(q =>
    typeof q === "string" ? q : q.query
  );

  // Locations: normalize to label strings
  const locationStrings = (config.locations ?? []).map(l =>
    typeof l === "string" ? l : l.label || l.location || ""
  ).filter(Boolean);

  const updateQueriesText = (text: string) => {
    const lines = text.split("\n").filter(Boolean);
    setConfig(prev => ({ ...prev, queries: lines.map(q => ({ query: q, tier: 1 })) }));
  };

  const updateListField = (key: keyof SearchesConfig, text: string) => {
    setConfig(prev => ({ ...prev, [key]: text.split("\n").filter(Boolean) }));
  };

  const updateDefault = (key: string, value: number | string) => {
    setConfig(prev => ({ ...prev, defaults: { ...(prev.defaults ?? {}), [key]: value } }));
  };

  const toggleSite = (id: string) => {
    setConfig(prev => ({ ...prev, sites: toggle(prev.sites ?? [], id) }));
  };
  const toggleTier = (t: number) => {
    setConfig(prev => ({ ...prev, tiers: toggle(prev.tiers ?? [1,2,3], t) }));
  };

  const labelSty: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b", marginBottom: 8, display: "block" };
  const textareaSty: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" };
  const inputSty: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 13, textAlign: "center", outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Platforms ── */}
      <div className="glass" style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--neon-blue)" }} />
          Job Platforms
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>— {sites.length} enabled</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALL_PLATFORMS.map(({ id, label }) => {
            const on = sites.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleSite(id)}
                style={{
                  padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: on ? "1.5px solid rgba(56,189,248,0.45)" : "1px solid rgba(255,255,255,0.08)",
                  background: on ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.03)",
                  color: on ? "#38bdf8" : "#64748b",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {on ? "✓ " : ""}{label}
              </button>
            );
          })}
        </div>
        {/* Workday + SmartExtract toggles */}
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { key: "enable_workday" as const, label: "Workday Boards", desc: "Auto-detect Workday job portals" },
            { key: "enable_smartextract" as const, label: "Smart Extract", desc: "Extract jobs from company career pages" },
          ].map(({ key, label, desc }) => {
            const on = !!config[key];
            return (
              <button
                key={key}
                onClick={() => setConfig(prev => ({ ...prev, [key]: !on }))}
                style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: on ? "1.5px solid rgba(167,139,250,0.45)" : "1px solid rgba(255,255,255,0.08)",
                  background: on ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.03)",
                  color: on ? "#a78bfa" : "#64748b",
                  cursor: "pointer", transition: "all 0.15s",
                  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                }}
              >
                <span>{on ? "✓ " : ""}{label}</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: on ? "rgba(167,139,250,0.7)" : "#475569" }}>{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Limits ── */}
      <div className="glass" style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Discovery Limits</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div>
            <label style={labelSty}>Results / Site</label>
            <input type="number" style={inputSty}
              value={defaults.results_per_site ?? 25}
              onChange={e => updateDefault("results_per_site", Number(e.target.value))} />
          </div>
          <div>
            <label style={labelSty}>Max Age (hours)</label>
            <input type="number" style={inputSty}
              value={defaults.hours_old ?? 72}
              onChange={e => updateDefault("hours_old", Number(e.target.value))} />
          </div>
          <div>
            <label style={labelSty}>Country (Indeed)</label>
            <input type="text" style={inputSty}
              value={defaults.country_indeed ?? "usa"}
              onChange={e => updateDefault("country_indeed", e.target.value)} />
          </div>
        </div>

        {/* Tiers */}
        <div style={{ marginTop: 14 }}>
          <label style={labelSty}>Active Tiers</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3].map(t => {
              const on = tiers.includes(t);
              return (
                <button key={t} onClick={() => toggleTier(t)} style={{
                  padding: "5px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: on ? "1.5px solid rgba(251,191,36,0.45)" : "1px solid rgba(255,255,255,0.08)",
                  background: on ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.03)",
                  color: on ? "#fbbf24" : "#64748b", cursor: "pointer", transition: "all 0.15s",
                }}>T{t}</button>
              );
            })}
            <span style={{ fontSize: 11, color: "var(--text-muted)", alignSelf: "center", marginLeft: 8 }}>
              Tier 1 = priority roles, Tier 3 = stretch roles
            </span>
          </div>
        </div>
      </div>

      {/* ── Queries + Locations ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="glass" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            Search Queries
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, marginLeft: 8 }}>{queryStrings.length} queries</span>
          </div>
          <textarea
            rows={8}
            style={textareaSty}
            value={queryStrings.join("\n")}
            onChange={e => updateQueriesText(e.target.value)}
            placeholder={"AI Engineer\nML Platform Engineer\nPrompt Engineer"}
          />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>One query per line</div>
        </div>

        <div className="glass" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            Locations
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, marginLeft: 8 }}>{locationStrings.length} locations</span>
          </div>
          <textarea
            rows={4}
            style={textareaSty}
            value={locationStrings.join("\n")}
            onChange={e => updateListField("locations", e.target.value)}
            placeholder={"Remote\nAtlanta, GA\nNew York, NY"}
          />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, marginBottom: 12 }}>One location per line</div>
          <label style={labelSty}>Exclude Titles</label>
          <textarea
            rows={3}
            style={textareaSty}
            value={(config.exclude_titles ?? []).join("\n")}
            onChange={e => updateListField("exclude_titles", e.target.value)}
            placeholder={"intern\nco-op\nclearance required"}
          />
        </div>
      </div>

      {/* ── Location filters ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="glass" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Accept Locations</div>
          <textarea
            rows={6}
            style={textareaSty}
            value={(config.location_accept ?? []).join("\n")}
            onChange={e => updateListField("location_accept", e.target.value)}
            placeholder={"Atlanta\nGA\nRemote\nUSA"}
          />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Job location must match one of these</div>
        </div>
        <div className="glass" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Reject Locations</div>
          <textarea
            rows={6}
            style={textareaSty}
            value={(config.location_reject ?? config.location_reject_non_remote ?? []).join("\n")}
            onChange={e => updateListField("location_reject", e.target.value)}
            placeholder={"India\nPhilippines\nonsite only"}
          />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Jobs with these location patterns are skipped</div>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn-primary" onClick={save} disabled={saving} style={{ minWidth: 160, justifyContent: "center" }}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Search Config</>}
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: "#34d399", display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle className="w-4 h-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

// ============ LLM TAB (AI Models) ============
interface LLMData {
  providers: {
    gemini: { configured: boolean; api_key_hint: string; default_model: string; models: { id: string; label: string }[] };
    openai: { configured: boolean; api_key_hint: string; default_model: string; models: { id: string; label: string }[] };
    ollama: { configured: boolean; base_url: string; default_model: string; models: { id: string; label: string }[] };
  };
  active_model: string | null;
  active_provider: string | null;
}

function LLMTab() {
  const [data, setData] = useState<LLMData | null>(null);
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("");
  const [selectedModel, setSelectedModel] = useState(""); // "" = use provider default
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/settings/llm");
    const d = await res.json();
    setData(d);
    setSelectedModel(d.active_model || "");
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = async () => {
    setSaving(true);
    const body: Record<string, string> = {};
    if (geminiKey) body.gemini_api_key = geminiKey;
    if (openaiKey) body.openai_api_key = openaiKey;
    if (ollamaUrl) body.llm_url = ollamaUrl;
    // Always send llm_model (empty string = remove override = use provider default)
    body.llm_model = selectedModel;

    await fetch("/api/settings/llm", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setGeminiKey("");
    setOpenaiKey("");
    fetchData();
  };

  // Collect all available models based on which providers are configured
  const allModels: { id: string; label: string; provider: string }[] = [];
  if (data?.providers.gemini.configured) {
    data.providers.gemini.models.forEach((m) => allModels.push({ ...m, provider: "Gemini" }));
  }
  if (data?.providers.openai.configured) {
    data.providers.openai.models.forEach((m) => allModels.push({ ...m, provider: "OpenAI" }));
  }
  if (data?.providers.ollama.configured) {
    data.providers.ollama.models.forEach((m) => allModels.push({ ...m, provider: "Ollama" }));
  }

  const modelOptions = [
    {
      id: "gemini",
      name: "Google Gemini",
      desc: `Free tier available. Default model: ${data?.providers.gemini.default_model || "gemini-2.0-flash-lite"}`,
      icon: "G",
      color: "text-blue-400 bg-blue-500/10",
    },
    {
      id: "openai",
      name: "OpenAI",
      desc: `GPT models. Default: ${data?.providers.openai.default_model || "gpt-4o-mini"}`,
      icon: "O",
      color: "text-green-400 bg-green-500/10",
    },
    {
      id: "claude",
      name: "Anthropic Claude",
      desc: "Used for auto-apply via Claude Code CLI.",
      icon: "C",
      color: "text-orange-400 bg-orange-500/10",
    },
    {
      id: "ollama",
      name: "Ollama (Local)",
      desc: "Free local models. Use gemma3:latest as fallback. Requires Ollama running on server.",
      icon: "L",
      color: "text-violet-400 bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {data?.active_provider && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          Active: <strong className="capitalize">{data.active_provider}</strong>
          {data.active_model
            ? <> — model: <strong>{data.active_model}</strong></>
            : <> — using provider default</>
          }
        </div>
      )}

      {/* Provider cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modelOptions.map((m) => {
          const providerData = data?.providers[m.id as keyof typeof data.providers];
          const configured = m.id === "claude" ? true : providerData?.configured;

          return (
            <div key={m.id} className={`rounded-xl border bg-slate-800/50 p-5 transition-colors ${
              data?.active_provider === m.id ? "border-cyan-500/40" : "border-slate-700/50"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${m.color}`}>
                  {m.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{m.name}</span>
                    {configured && <span className="w-2 h-2 rounded-full bg-emerald-400" title="Configured" />}
                  </div>
                  <p className="text-xs text-slate-400">{m.desc}</p>
                </div>
              </div>

              {m.id === "gemini" && (
                <input
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder={providerData && "api_key_hint" in providerData ? providerData.api_key_hint || "Enter Gemini API key..." : "Enter Gemini API key..."}
                  type="password"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              )}
              {m.id === "openai" && (
                <input
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={providerData && "api_key_hint" in providerData ? providerData.api_key_hint || "Enter OpenAI API key..." : "Enter OpenAI API key..."}
                  type="password"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              )}
              {m.id === "ollama" && (
                <div className="space-y-2">
                  <input
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder={providerData && "base_url" in providerData ? providerData.base_url || "http://localhost:11434/v1" : "http://localhost:11434/v1"}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-xs text-slate-500">
                    Run: <code className="text-violet-400">ollama pull gemma3:latest</code> — free local fallback
                  </p>
                </div>
              )}
              {m.id === "claude" && (
                <p className="text-xs text-slate-500">
                  Installed at <code className="text-slate-400">~/.local/bin/claude</code>. Used automatically for apply sessions.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Model selector — only shown when at least one provider is configured */}
      {allModels.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
          <h4 className="text-sm font-medium text-slate-300 mb-1">Active Model</h4>
          <p className="text-xs text-slate-500 mb-3">
            Override which model to use. Leave blank to use the provider default.
          </p>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">— Use provider default —</option>
            {allModels.map((m) => (
              <option key={m.id} value={m.id}>[{m.provider}] {m.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Priority note */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Provider Priority</h4>
        <p className="text-xs text-slate-400">
          <strong className="text-slate-200">1)</strong> Gemini API (set GEMINI_API_KEY) →{" "}
          <strong className="text-slate-200">2)</strong> OpenAI API (set OPENAI_API_KEY) →{" "}
          <strong className="text-slate-200">3)</strong> Ollama local (set LLM_URL). Claude Code CLI is always used for apply sessions.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
        {saved && <span className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Saved — restart backend to apply</span>}
      </div>
    </div>
  );
}

// ============ SYSTEM TAB ============
function SystemTab() {
  const [checks, setChecks] = useState<{ name: string; status: string; message: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState("");

  const runDoctor = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/doctor");
      const data = await res.json();
      setChecks(data.checks || []);
      setRaw(data.raw || "");
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { runDoctor(); }, [runDoctor]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">System Health</h3>
          <button
            onClick={runDoctor}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-slate-700 text-slate-300 text-xs hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
            Re-check
          </button>
        </div>

        {checks.length > 0 ? (
          <div className="space-y-2">
            {checks.map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                {c.status === "ok" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className={`w-4 h-4 shrink-0 ${c.status === "warn" ? "text-amber-400" : "text-rose-400"}`} />
                )}
                <span className="text-sm text-slate-300 flex-1">{c.message}</span>
                <StatusPill status={c.status} />
              </div>
            ))}
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 py-4 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Running diagnostics...
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-4">Click Re-check to run system diagnostics</p>
        )}
      </div>

      {raw && (
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Raw Output</h3>
          <pre className="terminal-output text-xs whitespace-pre-wrap">{raw}</pre>
        </div>
      )}
    </div>
  );
}
