"use client";

import { useEffect, useRef } from "react";
import { Copy, Trash2 } from "lucide-react";

interface TerminalOutputProps {
  lines: { line: string; timestamp?: string }[];
  onClear?: () => void;
  maxHeight?: string;
}

export default function TerminalOutput({ lines, onClear, maxHeight = "400px" }: TerminalOutputProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  const handleCopy = () => {
    const text = lines.map((l) => l.line).join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="relative rounded-xl border border-slate-700 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 border-b border-slate-700">
        <span className="text-xs text-slate-500 font-mono">output</span>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="text-slate-500 hover:text-slate-300 transition-colors" title="Copy">
            <Copy className="w-3.5 h-3.5" />
          </button>
          {onClear && (
            <button onClick={onClear} className="text-slate-500 hover:text-slate-300 transition-colors" title="Clear">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Output */}
      <div
        className="terminal-output"
        style={{ maxHeight, minHeight: "120px" }}
      >
        {lines.length === 0 ? (
          <span className="text-slate-600">Waiting for output...</span>
        ) : (
          lines.map((l, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {l.line}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
