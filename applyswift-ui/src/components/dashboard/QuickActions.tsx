"use client";

import { useState } from "react";
import { Rocket, Zap, Plus, Loader2 } from "lucide-react";
import { useSSE } from "@/hooks/useSSE";
import TerminalOutput from "@/components/shared/TerminalOutput";

export default function QuickActions() {
  const [url, setUrl] = useState("");
  const sse = useSSE();

  const handleApplyNext = () => {
    sse.start("/api/apply/run", { limit: 1 });
  };

  const handleAutoPilot = () => {
    if (!url.trim()) return;
    sse.start("/api/apply/url", { url: url.trim() });
    setUrl("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={handleApplyNext}
            disabled={sse.running}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {sse.running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Apply Next Job
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste job URL..."
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            onKeyDown={(e) => e.key === "Enter" && handleAutoPilot()}
          />
          <button
            onClick={handleAutoPilot}
            disabled={!url.trim() || sse.running}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Auto-Pilot
          </button>
          <button
            onClick={() => {
              const addUrl = url.trim();
              if (!addUrl) return;
              fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: addUrl }) })
                .then(() => setUrl(""));
            }}
            disabled={!url.trim()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-slate-700 text-slate-300 hover:bg-white/10 text-sm transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Live output */}
      {(sse.lines.length > 0 || sse.running) && (
        <TerminalOutput lines={sse.lines} onClear={sse.clear} />
      )}
    </div>
  );
}
