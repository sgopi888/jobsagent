"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Stats } from "@/lib/types";

interface PipelineFunnelProps {
  stats: Stats;
}

const STAGES = [
  { key: "total", label: "Discovered", status: "discovered" },
  { key: "with_description", label: "Enriched", status: "enriched" },
  { key: "scored", label: "Scored", status: "scored" },
  { key: "tailored", label: "Tailored", status: "tailored" },
  { key: "applied", label: "Applied", status: "applied" },
];

export default function PipelineFunnel({ stats }: PipelineFunnelProps) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
      <h3 className="text-sm font-medium text-slate-400 mb-4">Pipeline Funnel</h3>
      <div className="flex items-center justify-between gap-2 overflow-x-auto">
        {STAGES.map((stage, i) => {
          const count = stats[stage.key as keyof Stats] as number;
          return (
            <div key={stage.key} className="flex items-center gap-2">
              <Link
                href={`/jobs?status=${stage.status}`}
                className="flex flex-col items-center p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/60 transition-colors min-w-[90px]"
              >
                <span className="text-2xl font-bold text-slate-100">{count}</span>
                <span className="text-xs text-slate-400 mt-1">{stage.label}</span>
              </Link>
              {i < STAGES.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
