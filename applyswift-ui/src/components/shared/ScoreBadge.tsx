"use client";

interface ScoreBadgeProps {
  score: number | null;
  size?: "sm" | "md";
}

export default function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  if (score === null || score === undefined) {
    return <span className="text-slate-500 text-xs">--</span>;
  }

  let color = "text-rose-400 bg-rose-500/15 border-rose-500/30";
  if (score >= 7) color = "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
  else if (score >= 5) color = "text-amber-400 bg-amber-500/15 border-amber-500/30";

  const sizeClass = size === "md" ? "w-9 h-9 text-base" : "w-7 h-7 text-xs";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg font-bold border ${color} ${sizeClass}`}
    >
      {score}
    </span>
  );
}
