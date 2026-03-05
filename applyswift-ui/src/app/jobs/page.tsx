"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, ArrowUpRight, X, RefreshCw, Filter } from "lucide-react";
import type { Job } from "@/lib/types";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Ready", value: "ready" },
  { label: "Applied", value: "applied" },
  { label: "Tailored", value: "tailored" },
  { label: "Scored", value: "scored" },
  { label: "Enriched", value: "enriched" },
  { label: "Failed", value: "failed" },
];

function scoreColor(s?: number | null) {
  if (!s) return "var(--text-muted)";
  if (s >= 7) return "var(--neon-emerald)";
  if (s >= 5) return "var(--neon-amber)";
  return "var(--neon-rose)";
}

function statusBadge(job: Job) {
  if (job.applied_at) return { label: "Applied", bg: "rgba(52,211,153,0.12)", color: "#34d399" };
  if (job.apply_error) return { label: "Failed", bg: "rgba(251,113,133,0.12)", color: "#fb7185" };
  if (job.tailored_resume_path) return { label: "Ready", bg: "rgba(56,189,248,0.12)", color: "#38bdf8" };
  if (job.fit_score !== null) return { label: "Scored", bg: "rgba(167,139,250,0.12)", color: "#a78bfa" };
  if (job.full_description) return { label: "Enriched", bg: "rgba(251,191,36,0.12)", color: "#fbbf24" };
  return { label: "Discovered", bg: "rgba(148,163,184,0.1)", color: "#94a3b8" };
}

function AddJobModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!url.trim()) return;
    setSubmitting(true);
    await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    setSubmitting(false);
    onAdded();
    onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(2,4,10,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="glass" style={{ width: 420, padding: "28px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={16} /></button>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Add Job URL</div>
        <input className="input-dark" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} autoFocus style={{ marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={submit} disabled={!url.trim() || submitting} style={{ flex: 1, justifyContent: "center" }}>
            {submitting ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : "Add Job"}
          </button>
          <button className="btn-neon" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);
  const st = statusBadge(job);
  return (
    <>
      <div
        className="row-hover"
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 16px", cursor: "pointer",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {/* Score */}
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: `${scoreColor(job.fit_score)}18`,
          border: `1.5px solid ${scoreColor(job.fit_score)}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: scoreColor(job.fit_score), flexShrink: 0,
        }}>
          {job.fit_score ?? "—"}
        </div>

        {/* Title + site */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {job.title || "Unknown Role"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {job.site}{job.location ? ` · ${job.location}` : ""}
            {job.salary ? ` · ${job.salary}` : ""}
          </div>
        </div>

        {/* Status badge */}
        <span className="badge" style={{ background: st.bg, color: st.color, flexShrink: 0 }}>
          {st.label}
        </span>

        {/* Date */}
        <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", minWidth: 70, textAlign: "right" }}>
          {job.applied_at
            ? new Date(job.applied_at).toLocaleDateString()
            : job.scored_at
            ? new Date(job.scored_at).toLocaleDateString()
            : "—"}
        </div>

        {/* Open link */}
        <a
          href={job.url} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ color: "var(--text-muted)", display: "flex", padding: 4, flexShrink: 0 }}
        >
          <ArrowUpRight size={13} />
        </a>
      </div>

      {expanded && (
        <div style={{ padding: "14px 20px 14px 60px", background: "rgba(56,189,248,0.02)", borderBottom: "1px solid var(--border-subtle)" }}>
          {job.score_reasoning && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Score Reasoning</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{job.score_reasoning}</div>
            </div>
          )}
          {job.full_description && (
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, maxHeight: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                {job.full_description.slice(0, 400)}{job.full_description.length > 400 ? "…" : ""}
              </div>
            </div>
          )}
          {job.apply_error && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: 8, fontSize: 12, color: "#fb7185" }}>
              Error: {job.apply_error}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function JobsInner() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [showAdd, setShowAdd] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (minScore > 0) params.set("min_score", String(minScore));
    if (status !== "all") params.set("status", status);
    params.set("limit", "200");
    const res = await fetch(`/api/jobs?${params}`);
    if (res.ok) setJobs(await res.json());
    setLoading(false);
  }, [search, minScore, status]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} onAdded={fetchJobs} />}

      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, background: "linear-gradient(135deg, #f0f6ff 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Jobs
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>{jobs.length} jobs</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-neon" onClick={fetchJobs} disabled={loading}><RefreshCw size={13} /></button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Job</button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding: "14px 16px", marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="input-dark"
            placeholder="Search jobs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>

        {/* Score filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 5, 7, 8, 9].map(v => (
            <button
              key={v}
              className={`tab ${minScore === v ? "active" : ""}`}
              onClick={() => setMinScore(v)}
              style={{ padding: "5px 10px" }}
            >
              {v === 0 ? "Any" : `${v}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            className={`tab ${status === t.value ? "active" : ""}`}
            onClick={() => setStatus(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass" style={{ overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "9px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--text-muted)",
        }}>
          <div style={{ width: 32, flexShrink: 0 }}>Score</div>
          <div style={{ flex: 1 }}>Role · Company</div>
          <div style={{ width: 70 }}>Status</div>
          <div style={{ width: 70, textAlign: "right" }}>Date</div>
          <div style={{ width: 30 }} />
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No jobs found
          </div>
        ) : (
          jobs.map(job => <JobRow key={job.url} job={job} />)
        )}
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense>
      <JobsInner />
    </Suspense>
  );
}
