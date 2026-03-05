"use client";

import { useStats } from "@/hooks/useStats";
import { useSSE } from "@/hooks/useSSE";
import { useRouter } from "next/navigation";
import {
  Zap, Briefcase, CheckCircle2, Target, TrendingUp,
  ArrowUpRight, Send, GitBranch, RefreshCw, Activity,
  Clock, AlertCircle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

function StatOrb({
  value, label, color, icon: Icon, onClick, sublabel,
}: {
  value: number | string; label: string; color: string;
  icon: React.ElementType; onClick?: () => void; sublabel?: string;
}) {
  return (
    <div
      className="glass stat-card"
      onClick={onClick}
      style={{
        padding: "22px 20px",
        display: "flex", flexDirection: "column", gap: 14,
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Glow orb behind */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: color, opacity: 0.07, filter: "blur(20px)",
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={17} color={color} />
        </div>
        {onClick && (
          <ArrowUpRight size={14} color="var(--text-muted)" />
        )}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: 11, color: color, marginTop: 3, opacity: 0.8 }}>{sublabel}</div>
        )}
      </div>
    </div>
  );
}

function PipelineRing({ stages }: { stages: { label: string; count: number; color: string }[] }) {
  const total = stages.reduce((a, s) => a + s.count, 0) || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {stages.map((s) => (
        <div key={s.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{s.count}</span>
          </div>
          <div className="stage-bar">
            <div className="stage-bar-fill" style={{
              width: `${Math.min(100, (s.count / total) * 100)}%`,
              background: s.color,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AutoPilotPanel() {
  const [url, setUrl] = useState("");
  const sse = useSSE();
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [sse.lines]);

  const launch = () => {
    if (!url.trim() || sse.running) return;
    sse.start("/api/apply/url", { url: url.trim() });
  };

  return (
    <div className="glass" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Zap size={16} color="var(--neon-blue)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Auto-Pilot</span>
        {sse.running && (
          <span className="badge" style={{ background: "rgba(56,189,248,0.1)", color: "var(--neon-blue)", marginLeft: "auto" }}>
            <span className="pulse-dot" style={{ background: "var(--neon-blue)" }} />
            Running
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="input-dark"
          placeholder="Paste job URL — enrich, tailor, and apply in one shot"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && launch()}
          disabled={sse.running}
        />
        <button
          className="btn-primary"
          onClick={launch}
          disabled={sse.running || !url.trim()}
          style={{ whiteSpace: "nowrap", minWidth: 80 }}
        >
          {sse.running ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <><Send size={13} /> Fire</>}
        </button>
      </div>
      {sse.lines.length > 0 && (
        <div
          ref={termRef}
          className="terminal"
          style={{ maxHeight: 180, marginTop: 4 }}
        >
          {sse.lines.map((l, i) => <div key={i}>{l.line || "\u00a0"}</div>)}
        </div>
      )}
    </div>
  );
}

function AppliedList({ jobs }: { jobs: Array<{ url: string; title: string; site: string; applied_at: string }> }) {
  if (!jobs.length) return (
    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13 }}>
      No applications yet
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {jobs.slice(0, 8).map((j, i) => (
        <div
          key={j.url}
          className="row-hover"
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 4px",
            borderBottom: i < jobs.length - 1 ? "1px solid var(--border-subtle)" : "none",
          }}
        >
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--neon-emerald)",
            boxShadow: "0 0 6px rgba(52,211,153,0.5)",
            flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {j.title || "Unknown Role"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{j.site}</div>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {j.applied_at ? new Date(j.applied_at).toLocaleDateString() : "—"}
          </div>
          <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", display: "flex" }}>
            <ArrowUpRight size={13} />
          </a>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { stats, loading, refresh } = useStats();
  const router = useRouter();
  const [activeView, setActiveView] = useState<null | string>(null);

  const total = stats?.total ?? 0;
  const ready = stats?.ready_to_apply ?? 0;
  const applied = stats?.applied ?? 0;
  const successRate = applied > 0 && total > 0 ? Math.round((applied / total) * 100) : 0;

  const stageData = [
    { label: "Enriched",  count: stats?.with_description ?? 0, color: "#38bdf8" },
    { label: "Scored",    count: stats?.scored ?? 0,            color: "#a78bfa" },
    { label: "Tailored",  count: stats?.tailored ?? 0,          color: "#fbbf24" },
    { label: "Applied",   count: applied,                        color: "#34d399" },
  ];

  const appliedJobs = (stats as any)?.applied_jobs ?? [];

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, margin: 0,
            background: "linear-gradient(135deg, #f0f6ff 0%, #94a3b8 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Command Center
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
            {loading ? "Loading…" : `${total} jobs tracked · ${ready} ready to apply`}
          </p>
        </div>
        <button onClick={refresh} className="btn-neon" style={{ marginTop: 2 }}>
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatOrb
          value={total} label="Total Tracked" color="#38bdf8"
          icon={Briefcase}
          onClick={() => router.push("/jobs")}
          sublabel="Click to browse all"
        />
        <StatOrb
          value={ready} label="Ready to Apply" color="#a78bfa"
          icon={Target}
          onClick={() => router.push("/apply")}
          sublabel="Tailored + scored ≥7"
        />
        <StatOrb
          value={applied} label="Applied" color="#34d399"
          icon={CheckCircle2}
          onClick={() => setActiveView(activeView === "applied" ? null : "applied")}
          sublabel={activeView === "applied" ? "▲ showing list" : "Click to view"}
        />
        <StatOrb
          value={`${successRate}%`} label="Applied / Total" color="#fbbf24"
          icon={TrendingUp}
          sublabel={`${applied} of ${total}`}
        />
      </div>

      {/* Applied jobs expanded list */}
      {activeView === "applied" && (
        <div className="glass" style={{ padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={15} color="var(--neon-emerald)" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Applied Jobs</span>
            </div>
            <button onClick={() => router.push("/jobs?status=applied")} className="btn-neon" style={{ padding: "5px 12px", fontSize: 12 }}>
              View All <ArrowUpRight size={12} />
            </button>
          </div>
          <AppliedList jobs={appliedJobs} />
        </div>
      )}

      {/* Middle row: pipeline + auto-pilot */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 12, marginBottom: 20 }}>
        {/* Pipeline funnel */}
        <div className="glass" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <GitBranch size={15} color="var(--neon-violet)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Pipeline Flow</span>
            <button
              onClick={() => router.push("/pipeline")}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
            >
              <ArrowUpRight size={14} />
            </button>
          </div>
          <PipelineRing stages={stageData} />
        </div>

        {/* Auto-pilot */}
        <AutoPilotPanel />
      </div>

      {/* Bottom row: quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <QuickActionCard
          icon={GitBranch} color="#38bdf8" label="Run Pipeline"
          desc="Enrich → Score → Tailor all pending jobs"
          action={() => router.push("/pipeline")}
        />
        <QuickActionCard
          icon={Send} color="#a78bfa" label="Apply Next"
          desc="Launch auto-apply on the next ready job"
          action={() => router.push("/apply")}
        />
        <QuickActionCard
          icon={Activity} color="#34d399" label="View Logs"
          desc="Browse recent agent activity and errors"
          action={() => router.push("/settings")}
        />
      </div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon, color, label, desc, action,
}: {
  icon: React.ElementType; color: string; label: string; desc: string; action: () => void;
}) {
  return (
    <div
      className="glass stat-card"
      onClick={action}
      style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${color}15`, border: `1px solid ${color}25`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={17} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{desc}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, color, fontSize: 12 }}>
        Go <ArrowUpRight size={12} />
      </div>
    </div>
  );
}
