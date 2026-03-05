"use client";

import { useState, useCallback, useRef } from "react";

interface SSELine {
  line: string;
  timestamp: string;
}

export function useSSE() {
  const [lines, setLines] = useState<SSELine[]>([]);
  const [running, setRunning] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (url: string, body?: unknown) => {
    setLines([]);
    setRunning(true);
    setExitCode(null);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        setRunning(false);
        setExitCode(1);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const eventMatch = part.match(/^event: (\w+)/m);
          const dataMatch = part.match(/^data: (.+)$/m);

          if (!dataMatch) continue;

          try {
            const data = JSON.parse(dataMatch[1]);
            const eventType = eventMatch?.[1] || "message";

            if (eventType === "done") {
              setExitCode(data.exitCode ?? 0);
            } else if (eventType === "error") {
              setLines((prev) => [...prev, { line: `Error: ${data.message}`, timestamp: new Date().toISOString() }]);
            } else {
              setLines((prev) => [...prev, data as SSELine]);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setLines((prev) => [...prev, { line: `Connection error: ${String(err)}`, timestamp: new Date().toISOString() }]);
      }
    } finally {
      setRunning(false);
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setRunning(false);
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setExitCode(null);
  }, []);

  return { lines, running, exitCode, start, stop, clear };
}
