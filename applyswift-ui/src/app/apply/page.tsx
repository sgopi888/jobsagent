"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Zap, Play, RefreshCw, RotateCcw, ArrowUpRight,
  Mail, Key, X, AlertTriangle, FlaskConical,
  Gauge, Clock, MousePointerClick, DollarSign, Activity,
  ChevronRight, ListChecks, Square,
} from "lucide-react";
import { useSSE } from "@/hooks/useSSE";
import type { Job } from "@/lib/types";

/* ─────────────────────────── helpers ─────────────────────────── */

function ScoreDot({ score }: { score?: number | null }) {
  const s = score ?? 0;
  const color = s >= 7 ? "#34d399" : s >= 5 ? "#fbbf24" : "#fb7185";
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      background: `${color}18`, border: `1.5px solid ${color}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 700, color, flexShrink: 0,
    }}>{s || "—"}</div>
  );
}

/** Show job title, falling back to domain extracted from URL */
function jobLabel(job: { title?: string | null; url: string; site?: string | null }) {
  if (job.title && job.title !== "Unknown Role") return job.title;
  try {
    const host = new URL(job.url).hostname.replace(/^www\./, "");
    return job.site && job.site !== "manual" ? `Job at ${job.site}` : `Job at ${host}`;
  } catch {
    return job.site && job.site !== "manual" ? `Job at ${job.site}` : "Job (no title)";
  }
}

function elapsed(startIso: string | null) {
  if (!startIso) return "—";
  const sec = Math.floor((Date.now() - new Date(startIso).getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

/* ─────────────────────────── Verify Modal ─────────────────────────── */

function VerifyModal({ onSubmit, onCancel, jobTitle }: {
  onSubmit: (code: string) => void;
  onCancel: () => void;
  jobTitle?: string;
}) {
  const [code, setCode] = useState("");
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(2,4,10,0.9)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div className="glass" style={{ width: 440, padding: "30px", position: "relative" }}>
        <button onClick={onCancel} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
          <X size={16} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Mail size={20} color="#a78bfa" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Email Verification Required</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{jobTitle || "Job application"}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.7, background: "rgba(167,139,250,0.06)", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.15)" }}>
          The employer sent a code to your email. The browser tab is still open and waiting.
          Enter the code — Claude will fill it in and finish the submission.
        </div>
        <label style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, display: "block", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Verification Code
        </label>
        <input
          className="input-dark"
          placeholder="e.g.  A8F2X9  or  123456"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && code.trim() && onSubmit(code.trim())}
          autoFocus
          style={{ fontFamily: "monospace", fontSize: 20, letterSpacing: "0.25em", fontWeight: 700, textAlign: "center", marginBottom: 16 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={() => onSubmit(code.trim())} disabled={!code.trim()} style={{ flex: 1, justifyContent: "center" }}>
            <Key size={14} /> Submit Code
          </button>
          <button className="btn-neon" onClick={onCancel}>Skip</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Cockpit Console ─────────────────────────── */

interface CockpitProps {
  running: boolean;
  lines: { line: string; timestamp: string }[];
  exitCode: number | null;
  mode: "url" | "list" | "verify" | null;
  currentJob: string;
  termRef: React.RefObject<HTMLDivElement | null>;
  onClear: () => void;
  onStop: () => void;
}

function CockpitConsole({ running, lines, exitCode, mode, currentJob, termRef, onClear, onStop }: CockpitProps) {
  const allText = lines.map(l => l.line).join("\n");
  const costMatch = allText.match(/\$([0-9]+\.[0-9]+)/g);
  const cost = costMatch ? parseFloat(costMatch[costMatch.length - 1].replace("$", "")) : null;
  const lastNonEmpty = lines.filter(l => l.line.trim()).slice(-1)[0];
  const lastAction = lastNonEmpty?.line?.replace(/^\s*[\d:.TZ-]+\s*/, "").slice(0, 72) || "—";
  const startTime = lines[0]?.timestamp || null;

  const statusColor = running ? "#fbbf24" : exitCode === 0 ? "#34d399" : exitCode !== null ? "#fb7185" : "#475569";
  const statusLabel = running ? "ACTIVE" : exitCode === 0 ? "COMPLETE" : exitCode !== null ? "ERROR" : "IDLE";
  const modeLabel = mode === "url" ? "AUTO-PILOT URL" : mode === "list" ? "APPLY FROM LIST" : mode === "verify" ? "VERIFICATION" : "STANDBY";

  return (
    <div style={{
      background: "#040710",
      border: "1px solid rgba(56,189,248,0.12)",
      borderRadius: 16, overflow: "hidden",
    }}>
      {/* HUD Top Bar */}
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid rgba(56,189,248,0.08)", background: "rgba(56,189,248,0.03)" }}>
        <div style={{ padding: "9px 16px", borderRight: "1px solid rgba(56,189,248,0.08)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor, boxShadow: running ? `0 0 8px ${statusColor}88` : "none", transition: "all 0.4s" }} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: statusColor, fontFamily: "monospace" }}>{statusLabel}</span>
        </div>
        <div style={{ padding: "9px 16px", borderRight: "1px solid rgba(56,189,248,0.08)", display: "flex", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(56,189,248,0.55)", fontFamily: "monospace" }}>{modeLabel}</span>
        </div>
        {currentJob && (
          <div style={{ padding: "9px 16px", flex: 1, overflow: "hidden", display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentJob}</span>
          </div>
        )}
        <div style={{ marginLeft: "auto", padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          {running && (
            <button
              onClick={onStop}
              style={{
                background: "rgba(251,113,133,0.1)",
                border: "1px solid rgba(251,113,133,0.3)",
                borderRadius: 5,
                padding: "3px 10px",
                fontSize: 9,
                color: "#fb7185",
                cursor: "pointer",
                fontWeight: 800,
                letterSpacing: "0.08em",
                fontFamily: "monospace",
                display: "flex",
                alignItems: "center",
                gap: 5
              }}
            >
              <Square size={8} fill="currentColor" /> STOP
            </button>
          )}
          <button onClick={onClear} style={{ background: "none", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 5, padding: "3px 10px", fontSize: 9, color: "rgba(255,255,255,0.25)", cursor: "pointer", letterSpacing: "0.08em", fontFamily: "monospace" }}>
            CLR
          </button>
        </div>
      </div>

      {/* Metric gauges */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid rgba(56,189,248,0.07)" }}>
        {[
          { icon: Clock, label: "ELAPSED", value: startTime && running ? elapsed(startTime) : startTime ? elapsed(startTime) : "—", color: "#38bdf8" },
          { icon: MousePointerClick, label: "ACTIONS", value: String(lines.filter(l => l.line.includes("→") || l.line.toLowerCase().includes("click") || l.line.toLowerCase().includes("type") || l.line.toLowerCase().includes("navig")).length || 0), color: "#a78bfa" },
          { icon: DollarSign, label: "COST", value: cost != null ? `$${cost.toFixed(3)}` : "—", color: "#34d399" },
          { icon: Activity, label: "LOG LINES", value: String(lines.length), color: "#fbbf24" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ padding: "11px 16px", borderRight: "1px solid rgba(56,189,248,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
            <Icon size={13} color={`${color}60`} />
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: 2, fontFamily: "monospace" }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "monospace" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Last Action ticker */}
      <div style={{
        padding: "7px 16px", borderBottom: "1px solid rgba(56,189,248,0.07)",
        display: "flex", alignItems: "center", gap: 8,
        background: running ? "rgba(251,191,36,0.025)" : "transparent",
        minHeight: 34,
      }}>
        <ChevronRight size={11} color={running ? "#fbbf24" : "rgba(255,255,255,0.15)"} />
        <span style={{
          fontSize: 11, fontFamily: "monospace",
          color: running ? "rgba(251,191,36,0.75)" : "rgba(255,255,255,0.28)",
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {lastAction}
        </span>
        {running && <span className="pulse-dot" style={{ background: "#fbbf24", width: 5, height: 5, flexShrink: 0 }} />}
      </div>

      {/* Terminal log */}
      <div ref={termRef} style={{
        height: 260, overflowY: "auto", padding: "10px 16px",
        fontSize: 11, lineHeight: 1.75, fontFamily: "monospace",
      }}>
        {lines.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.12)", textAlign: "center", paddingTop: 70, letterSpacing: "0.1em", fontSize: 10 }}>
            — AWAITING SIGNAL —
          </div>
        ) : (
          lines.map((l, i) => {
            const txt = l.line || "\u00a0";
            const isResult = txt.includes("RESULT:");
            const isError = txt.toLowerCase().includes("error") || txt.toLowerCase().includes("failed") || txt.toLowerCase().includes("✗");
            const isSuccess = txt.includes("✓") || txt.toLowerCase().includes("applied") || txt.toLowerCase().includes("success");
            const isEvent = txt.startsWith("[W") || txt.includes("[bold");
            const color = isResult ? "#38bdf8" : isError ? "#fb7185" : isSuccess ? "#34d399" : isEvent ? "#a78bfa" : "rgba(255,255,255,0.55)";
            const ts = l.timestamp ? new Date(l.timestamp).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
            return (
              <div key={i} style={{ color, display: "flex", gap: 10 }}>
                <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10, flexShrink: 0, marginTop: 1 }}>{ts}</span>
                <span>{txt}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────── */

interface SearchConfig { sites?: string[]; defaults?: { results_per_site?: number; hours_old?: number }; enable_workday?: boolean; enable_smartextract?: boolean; tiers?: number[]; queries?: unknown[] }

export default function ApplyPage() {
  const [queue, setQueue] = useState<Job[]>([]);
  const [history, setHistory] = useState<Job[]>([]);
  const [pendingVerify, setPendingVerify] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchConfig, setSearchConfig] = useState<SearchConfig | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [activeMode, setActiveMode] = useState<"url" | "list" | "verify" | null>(null);
  const [currentJob, setCurrentJob] = useState("");
  const [verifyModal, setVerifyModal] = useState<{ url: string; title?: string } | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const batchRef = useRef(false); // ref for access inside SSE exit callback
  const dryRunRef = useRef(dryRun);
  const sse = useSSE();
  const termRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync with state (refs are readable inside stale closures)
  useEffect(() => { dryRunRef.current = dryRun; }, [dryRun]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, hRes, pvRes, scRes] = await Promise.all([
        fetch("/api/jobs?status=ready&limit=50"),
        fetch("/api/jobs?status=applied&limit=30"),
        fetch("/api/jobs?status=pending_verification&limit=10"),
        fetch("/api/settings/searches"),
      ]);
      if (qRes.ok) setQueue(await qRes.json());
      if (hRes.ok) setHistory(await hRes.json());
      if (pvRes.ok) setPendingVerify(await pvRes.json());
      if (scRes.ok) setSearchConfig(await scRes.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (sse.exitCode !== null) {
      const combined = sse.lines.map(l => l.line).join("\n");

      // Check for verification first — pause batch mode if verification needed
      const needsVerify = (
        combined.toLowerCase().includes("needs_verification") ||
        combined.toLowerCase().includes("pending_verification") ||
        combined.toLowerCase().includes("email verification")
      );
      if (needsVerify) {
        // Pause batch — user must verify first
        batchRef.current = false;
        setBatchRunning(false);
        const match = combined.match(/NEEDS_VERIFICATION:\s*(https?:\/\/\S+)/i);
        const jobUrl = match?.[1] || pendingVerify[0]?.url || "";
        setVerifyModal({ url: jobUrl, title: pendingVerify[0]?.title || undefined });
        fetchData();
        return;
      }

      // Refresh data, then auto-continue batch if active
      fetchData().then(async () => {
        if (!batchRef.current) return; // batch was stopped
        // Re-fetch queue after data refresh
        try {
          const res = await fetch("/api/jobs?status=ready&limit=50");
          const freshQueue: Job[] = res.ok ? await res.json() : [];
          if (freshQueue.length === 0) {
            // Queue empty — batch done
            batchRef.current = false;
            setBatchRunning(false);
            setActiveMode(null);
            return;
          }
          // Wait 3s between jobs so Chrome has time to close
          await new Promise(r => setTimeout(r, 3000));
          if (!batchRef.current) return; // stopped during wait
          sse.clear();
          setCurrentJob(jobLabel(freshQueue[0]));
          sse.start("/api/apply/run", { limit: 1, dry_run: dryRunRef.current });
        } catch {
          batchRef.current = false;
          setBatchRunning(false);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sse.exitCode]);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [sse.lines]);

  const handleApplyUrl = () => {
    if (!urlInput.trim() || sse.running) return;
    setActiveMode("url");
    setCurrentJob(urlInput.trim());
    sse.clear();
    sse.start("/api/apply/url", { url: urlInput.trim(), dry_run: dryRun });
  };

  // "Apply Next" — one job only, no auto-continue (search engine jobs only)
  const handleApplyList = () => {
    const searchQueue = queue.filter(j => j.strategy !== "web-ui");
    if (sse.running || searchQueue.length === 0) return;
    batchRef.current = false;
    setBatchRunning(false);
    setActiveMode("list");
    setCurrentJob(searchQueue[0] ? jobLabel(searchQueue[0]) : "Next in queue");
    sse.clear();
    sse.start("/api/apply/run", { limit: 1, dry_run: dryRun });
  };

  // "Apply All" — runs one job at a time, auto-continues until queue empty (search engine jobs only)
  const handleApplyAll = () => {
    const searchQueue = queue.filter(j => j.strategy !== "web-ui");
    if (sse.running || searchQueue.length === 0) return;
    batchRef.current = true;
    setBatchRunning(true);
    setActiveMode("list");
    setCurrentJob(searchQueue[0] ? jobLabel(searchQueue[0]) : "Next in queue");
    sse.clear();
    sse.start("/api/apply/run", { limit: 1, dry_run: dryRun });
  };

  const handleVerifySubmit = (code: string) => {
    if (!code || !verifyModal) return;
    const jobUrl = verifyModal.url;
    setVerifyModal(null);
    setActiveMode("verify");
    setCurrentJob(pendingVerify[0]?.title || jobUrl);
    sse.clear();
    sse.start("/api/apply/verify", { url: jobUrl, code });
  };

  const handleStop = async () => {
    // Cancel batch mode first so the exit effect doesn't restart
    batchRef.current = false;
    setBatchRunning(false);
    // 1. Abort the SSE stream on the client side immediately
    sse.stop();
    // 2. Kill the server-side applypilot subprocess (Chrome stays open for verification)
    await fetch("/api/apply/stop", { method: "POST" });
    setActiveMode(null);
  };

  const handleResetFailed = async () => {
    await fetch("/api/apply/reset", { method: "POST" });
    fetchData();
  };

  const showVerifyHint = !sse.running && sse.lines.map(l => l.line).join("").toLowerCase().includes("verif");

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {verifyModal && (
        <VerifyModal
          jobTitle={pendingVerify[0]?.title || verifyModal.url}
          onSubmit={handleVerifySubmit}
          onCancel={() => setVerifyModal(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, background: "linear-gradient(135deg, #f0f6ff 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Apply
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
            {queue.length} ready · {history.length} applied
            {pendingVerify.length > 0 && <span style={{ color: "#a78bfa" }}> · {pendingVerify.length} awaiting verification</span>}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Dry Run toggle */}
          <button
            onClick={() => setDryRun(!dryRun)}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "7px 14px",
              borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
              border: dryRun ? "1.5px solid rgba(251,191,36,0.5)" : "1px solid var(--border-subtle)",
              background: dryRun ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.03)",
              color: dryRun ? "#fbbf24" : "var(--text-muted)",
              transition: "all 0.2s",
            }}
          >
            <FlaskConical size={13} />
            Dry Run {dryRun ? "ON" : "OFF"}
          </button>
          <button className="btn-neon" onClick={handleResetFailed} title="Reset failed jobs">
            <RotateCcw size={13} /> Reset Failed
          </button>
          <button className="btn-neon" onClick={fetchData} disabled={loading}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Dry run notice */}
      {dryRun && (
        <div style={{ marginBottom: 14, padding: "10px 16px", background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 10, fontSize: 12, color: "#fbbf24", display: "flex", gap: 8, alignItems: "center" }}>
          <FlaskConical size={14} />
          <strong>Dry Run Mode ON</strong> — Pipeline and apply steps run normally, but the final submit action is skipped. Safe for testing.
        </div>
      )}

      {/* Search Config Strip — shows active platforms / limits */}
      {searchConfig && (
        <div style={{ marginBottom: 14, padding: "10px 16px", background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(56,189,248,0.5)", textTransform: "uppercase", flexShrink: 0 }}>Discovery</span>
          {/* Platforms */}
          {(searchConfig.sites ?? []).map((s: string) => (
            <span key={s} style={{ fontSize: 11, fontWeight: 600, color: "#38bdf8", padding: "2px 8px", background: "rgba(56,189,248,0.1)", borderRadius: 5, border: "1px solid rgba(56,189,248,0.2)" }}>
              {s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          ))}
          {searchConfig.enable_workday && <span style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", padding: "2px 8px", background: "rgba(167,139,250,0.1)", borderRadius: 5, border: "1px solid rgba(167,139,250,0.2)" }}>Workday</span>}
          {searchConfig.enable_smartextract && <span style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", padding: "2px 8px", background: "rgba(167,139,250,0.1)", borderRadius: 5, border: "1px solid rgba(167,139,250,0.2)" }}>SmartExtract</span>}
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>·</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{searchConfig.defaults?.results_per_site ?? 25} results/site</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>· {searchConfig.defaults?.hours_old ?? 72}h max age</span>
          {(searchConfig.tiers ?? []).length > 0 && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>· Tiers {(searchConfig.tiers ?? []).join(",")}</span>}
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>· {(searchConfig.queries ?? []).length} queries</span>
          <a href="/settings" style={{ marginLeft: "auto", fontSize: 11, color: "rgba(56,189,248,0.5)", textDecoration: "none" }}>Edit →</a>
        </div>
      )}

      {/* Pending Verification Banner */}
      {pendingVerify.length > 0 && (
        <div style={{ marginBottom: 16, padding: "14px 18px", background: "rgba(167,139,250,0.07)", border: "1.5px solid rgba(167,139,250,0.3)", borderRadius: 14, display: "flex", alignItems: "center", gap: 14 }}>
          <AlertTriangle size={20} color="#a78bfa" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginBottom: 2 }}>Email Verification Needed</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              <strong>{pendingVerify[0]?.title || "A job"}</strong> — browser is still open, check your inbox.
            </div>
          </div>
          <button className="btn-primary" onClick={() => setVerifyModal({ url: pendingVerify[0].url, title: pendingVerify[0].title || undefined })} style={{ whiteSpace: "nowrap" }}>
            <Key size={13} /> Enter Code
          </button>
        </div>
      )}

      {/* ── Two Action Panels ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>

        {/* Apply URL */}
        <div className="glass" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={15} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Apply URL</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Full pipeline — paste any job link</div>
            </div>
          </div>
          <input
            className="input-dark"
            placeholder="https://careers.company.com/job/..."
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleApplyUrl()}
            disabled={sse.running}
            style={{ marginBottom: 10 }}
          />
          <button
            className="btn-primary"
            onClick={handleApplyUrl}
            disabled={sse.running || !urlInput.trim()}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {sse.running && activeMode === "url"
              ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Running…</>
              : <><Zap size={13} /> {dryRun ? "Dry-Run URL" : "Auto-Pilot URL"}</>
            }
          </button>
        </div>

        {/* Apply List */}
        <div className="glass" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ListChecks size={15} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Apply List</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {batchRunning ? "Running all jobs…" : "Apply to search engine jobs"}
              </div>
            </div>
            {batchRunning && <span className="pulse-dot" style={{ background: "#34d399", width: 6, height: 6, flexShrink: 0, marginLeft: "auto" }} />}
          </div>
          {/* Top job preview — search engine queue only (excludes manually added jobs) */}
          {(() => {
            const searchQueue = queue.filter(j => j.strategy !== "web-ui");
            const topJob = searchQueue[0];
            return topJob ? (
              <div style={{ marginBottom: 10, padding: "9px 12px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.12)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <ScoreDot score={topJob.fit_score} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {jobLabel(topJob)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{topJob.site}{topJob.location ? ` · ${topJob.location}` : ""}</div>
                </div>
                <a href={topJob.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", display: "flex" }}><ArrowUpRight size={12} /></a>
              </div>
            ) : (
              <div style={{ marginBottom: 10, padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                {queue.length > 0 ? "Only manual jobs in queue — use Apply URL" : "Queue empty — run pipeline first"}
              </div>
            );
          })()}
          {/* Two buttons: Apply Next (one job) and Apply All (entire queue) */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-emerald"
              onClick={handleApplyList}
              disabled={sse.running || queue.filter(j => j.strategy !== "web-ui").length === 0}
              style={{ flex: 1, justifyContent: "center" }}
              title="Apply to the next job then stop"
            >
              {sse.running && activeMode === "list" && !batchRunning
                ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Running…</>
                : <><Play size={13} /> {dryRun ? "Dry-Run 1" : "Apply Next"}</>
              }
            </button>
            <button
              className="btn-emerald"
              onClick={handleApplyAll}
              disabled={sse.running || queue.filter(j => j.strategy !== "web-ui").length === 0}
              style={{ flex: 1, justifyContent: "center", opacity: batchRunning ? 1 : 0.85 }}
              title={`Apply to all ${queue.filter(j => j.strategy !== "web-ui").length} queued jobs sequentially`}
            >
              {sse.running && activeMode === "list" && batchRunning
                ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Batch…</>
                : <><ListChecks size={13} /> {dryRun ? "Dry-Run All" : `Apply All (${queue.filter(j => j.strategy !== "web-ui").length})`}</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── Cockpit Console ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Gauge size={13} color="rgba(56,189,248,0.5)" />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Agent Console</span>
          {showVerifyHint && pendingVerify.length > 0 && (
            <button className="btn-primary" style={{ marginLeft: "auto", padding: "4px 12px", fontSize: 11 }} onClick={() => setVerifyModal({ url: pendingVerify[0].url, title: pendingVerify[0].title || undefined })}>
              <Key size={11} /> Enter Verify Code
            </button>
          )}
        </div>
        <CockpitConsole
          running={sse.running}
          lines={sse.lines}
          exitCode={sse.exitCode}
          mode={activeMode}
          currentJob={currentJob}
          termRef={termRef}
          onClear={() => { sse.clear(); setActiveMode(null); setCurrentJob(""); }}
          onStop={handleStop}
        />
      </div>

      {/* ── Ready Queue + Applied History ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        {/* Ready Queue */}
        <div className="glass" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
            Ready Queue — {queue.length}
          </div>
          {queue.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)", fontSize: 12 }}>No jobs ready. Run the pipeline first.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", maxHeight: 300, overflowY: "auto" }}>
              {queue.map((job, i) => (
                <div key={job.url} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderBottom: i < queue.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <ScoreDot score={job.fit_score} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{jobLabel(job)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{job.site}{job.location ? ` · ${job.location}` : ""}</div>
                  </div>
                  <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", display: "flex", padding: 4, flexShrink: 0 }}><ArrowUpRight size={12} /></a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applied History */}
        <div className="glass" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
            Applied — {history.length}
          </div>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)", fontSize: 12 }}>No applications yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", maxHeight: 300, overflowY: "auto" }}>
              {history.map((job, i) => (
                <div key={job.url} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderBottom: i < history.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 5px rgba(52,211,153,0.45)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{jobLabel(job)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {job.site} · {job.applied_at ? new Date(job.applied_at).toLocaleDateString() : "—"}
                      {job.apply_duration_ms ? ` · ${Math.round(job.apply_duration_ms / 1000)}s` : ""}
                    </div>
                  </div>
                  <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", display: "flex", padding: 4, flexShrink: 0 }}><ArrowUpRight size={12} /></a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
