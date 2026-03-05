"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, FileText, BarChart3, Scissors, Mail, FileOutput,
  Play, RefreshCw, Zap, ChevronRight,
} from "lucide-react";
import { useSSE } from "@/hooks/useSSE";

const STAGES = [
  { id: "discover", label: "Discover",  icon: Search,     color: "#38bdf8", desc: "Find new job postings" },
  { id: "enrich",   label: "Enrich",    icon: FileText,   color: "#a78bfa", desc: "Fetch full descriptions" },
  { id: "score",    label: "Score",     icon: BarChart3,  color: "#fbbf24", desc: "AI fit scoring 1–10" },
  { id: "tailor",   label: "Tailor",    icon: Scissors,   color: "#34d399", desc: "Custom resume per job" },
  { id: "cover",    label: "Cover",     icon: Mail,       color: "#f472b6", desc: "Write cover letters" },
  { id: "pdf",      label: "PDF",       icon: FileOutput, color: "#fb7185", desc: "Generate PDF files" },
];

export default function PipelinePage() {
  const [pending, setPending] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string[]>(["enrich", "score", "tailor"]);
  const [minScore, setMinScore] = useState(7);
  const [validationMode, setValidationMode] = useState("normal");
  const sse = useSSE();
  const termRef = useRef<HTMLDivElement>(null);

  const fetchPending = useCallback(async () => {
    const r = await fetch(`/api/pipeline/status?min_score=${minScore}`);
    if (r.ok) setPending(await r.json());
  }, [minScore]);

  useEffect(() => { fetchPending(); }, [fetchPending]);
  useEffect(() => {
    if (sse.exitCode !== null) fetchPending();
  }, [sse.exitCode, fetchPending]);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [sse.lines]);

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const runPipeline = () => {
    if (sse.running || selected.length === 0) return;
    const ordered = STAGES.map(s => s.id).filter(s => selected.includes(s));
    sse.start("/api/pipeline/run", { stages: ordered, min_score: minScore, validation_mode: validationMode });
  };

  const runSingle = (id: string) => {
    if (sse.running) return;
    sse.start("/api/pipeline/run", { stages: [id], min_score: minScore, validation_mode: validationMode });
  };

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, background: "linear-gradient(135deg, #f0f6ff 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Pipeline
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
            Run stages to process your job queue
          </p>
        </div>
        <button onClick={fetchPending} className="btn-neon"><RefreshCw size={13} /></button>
      </div>

      {/* Stage selector */}
      <div className="glass" style={{ padding: "20px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14 }}>
          Select Stages
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 18 }}>
          {STAGES.map(({ id, label, icon: Icon, color, desc }) => {
            const active = selected.includes(id);
            const cnt = pending[id] ?? 0;
            return (
              <div
                key={id}
                onClick={() => toggle(id)}
                style={{
                  padding: "14px 10px",
                  borderRadius: 12,
                  border: active ? `1.5px solid ${color}50` : "1px solid var(--border-subtle)",
                  background: active ? `${color}0f` : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <Icon size={18} color={active ? color : "var(--text-muted)"} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: active ? color : "var(--text-secondary)", marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{desc}</div>
                {cnt > 0 && (
                  <div style={{
                    marginTop: 8, padding: "2px 8px", borderRadius: 10,
                    background: `${color}18`, color, fontSize: 11, fontWeight: 600,
                    display: "inline-block",
                  }}>
                    {cnt} pending
                  </div>
                )}
                <button
                  onClick={e => { e.stopPropagation(); runSingle(id); }}
                  disabled={sse.running}
                  style={{
                    marginTop: 8, padding: "3px 10px", fontSize: 11,
                    borderRadius: 6, border: `1px solid ${color}30`,
                    background: `${color}0f`, color, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4, margin: "8px auto 0",
                    opacity: sse.running ? 0.4 : 1,
                  }}
                >
                  <Play size={10} /> Run
                </button>
              </div>
            );
          })}
        </div>

        {/* Options row */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Min Score</span>
            {[5, 6, 7, 8].map(v => (
              <button key={v} className={`tab ${minScore === v ? "active" : ""}`} onClick={() => setMinScore(v)} style={{ padding: "4px 10px" }}>
                {v}+
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Validation</span>
            {["strict", "normal", "lenient"].map(v => (
              <button key={v} className={`tab ${validationMode === v ? "active" : ""}`} onClick={() => setValidationMode(v)} style={{ padding: "4px 10px", textTransform: "capitalize" }}>
                {v}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              className="btn-primary"
              onClick={runPipeline}
              disabled={sse.running || selected.length === 0}
              style={{ minWidth: 120, justifyContent: "center" }}
            >
              {sse.running
                ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Running…</>
                : <><Zap size={13} /> Run {selected.length} Stage{selected.length !== 1 ? "s" : ""}</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Terminal output */}
      {(sse.lines.length > 0 || sse.running) && (
        <div className="glass" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {sse.running
                ? <><span className="pulse-dot" style={{ background: "var(--neon-blue)" }} /><span style={{ fontSize: 13, fontWeight: 600, color: "var(--neon-blue)" }}>Pipeline Running</span></>
                : <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                    Done {sse.exitCode === 0 ? "✓" : `(exit ${sse.exitCode})`}
                  </span>
              }
            </div>
            <button onClick={sse.clear} className="btn-neon" style={{ padding: "4px 10px", fontSize: 12 }}>Clear</button>
          </div>
          <div ref={termRef} className="terminal" style={{ maxHeight: 420 }}>
            {sse.lines.map((l, i) => <div key={i}>{l.line || "\u00a0"}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
