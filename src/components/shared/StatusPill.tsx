"use client";

const STYLES: Record<string, string> = {
  applied: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  ready: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  tailored: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  scored: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  enriched: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  discovered: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  failed: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  running: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  idle: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  error: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  ok: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  missing: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  warn: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  applying: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  starting: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

interface StatusPillProps {
  status: string;
  className?: string;
}

export default function StatusPill({ status, className = "" }: StatusPillProps) {
  const style = STYLES[status.toLowerCase()] || STYLES.idle;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}>
      {status}
    </span>
  );
}
