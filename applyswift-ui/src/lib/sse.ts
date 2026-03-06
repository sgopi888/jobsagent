// SSE response builder for streaming CLI output

import { type ChildProcess } from "child_process";

/** Build an SSE ReadableStream from a ChildProcess */
export function sseFromProcess(proc: ChildProcess): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      let closed = false;

      function send(event: string, data: unknown) {
        if (closed) return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // stream already closed
        }
      }

      function closeOnce() {
        if (closed) return;
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      }

      proc.stdout?.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          send("message", { line, timestamp: new Date().toISOString() });
        }
      });

      proc.stderr?.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          send("message", { line: `[stderr] ${line}`, timestamp: new Date().toISOString() });
        }
      });

      proc.on("close", (code) => {
        send("done", { exitCode: code ?? 1 });
        closeOnce();
      });

      proc.on("error", (err) => {
        send("error", { message: err.message });
        closeOnce();
      });
    },

    cancel() {
      proc.kill("SIGTERM");
    },
  });
}

/** Build an SSE Response from a ChildProcess */
export function sseResponse(proc: ChildProcess): Response {
  return new Response(sseFromProcess(proc), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
