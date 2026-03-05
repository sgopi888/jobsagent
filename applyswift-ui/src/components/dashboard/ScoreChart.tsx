"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Stats } from "@/lib/types";

interface ScoreChartProps {
  stats: Stats;
}

export default function ScoreChart({ stats }: ScoreChartProps) {
  const data = Array.from({ length: 11 }, (_, i) => {
    const found = stats.score_distribution.find(([score]) => score === i);
    return { score: i, count: found ? found[1] : 0 };
  });

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
      <h3 className="text-sm font-medium text-slate-400 mb-4">Score Distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="score" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0" }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.score}
                fill={entry.score >= 7 ? "#34d399" : entry.score >= 5 ? "#fbbf24" : "#fb7185"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
