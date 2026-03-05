"use client";

import { Briefcase, Target, CheckCircle, TrendingUp } from "lucide-react";
import type { Stats } from "@/lib/types";

interface StatsCardsProps {
  stats: Stats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const successRate = stats.applied > 0
    ? Math.round(((stats.applied - stats.apply_errors) / stats.applied) * 100)
    : 0;

  const cards = [
    { label: "Total Jobs", value: stats.total, icon: Briefcase, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Ready to Apply", value: stats.ready_to_apply, icon: Target, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Applied", value: stats.applied, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Success Rate", value: `${successRate}%`, icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">{card.label}</span>
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-100">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
