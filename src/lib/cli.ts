// Subprocess spawner for applypilot CLI commands

import { spawn, type ChildProcess } from "child_process";

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/** Find the applypilot command */
function getCommand(): string {
  return process.env.APPLYPILOT_CMD || "applypilot";
}

/** Run an applypilot CLI command and return the full output */
export async function runCli(args: string[]): Promise<CliResult> {
  return new Promise((resolve) => {
    const cmd = getCommand();
    const proc = spawn(cmd, args, {
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });

    proc.on("error", (err) => {
      resolve({ exitCode: 1, stdout, stderr: err.message });
    });
  });
}

/** Spawn an applypilot command and return the ChildProcess for streaming.
 *
 * Key env vars for Chrome to open a visible window when launched from the
 * Next.js server process (which has no TTY and may lack display/shell env):
 *   DISPLAY        – X11 display (macOS: not needed; Linux: usually :0)
 *   HOME           – needed so Chrome can find its profile dir
 *   PATH           – inherits shell PATH so `chrome`, `google-chrome`, etc. resolve
 *   TERM           – prevent readline/tty errors inside applypilot
 */
export function spawnCli(args: string[]): ChildProcess {
  const cmd = getCommand();
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    // Ensure a proper HOME so applypilot can find ~/.applypilot config
    HOME: process.env.HOME || require("os").homedir(),
    // On Linux/WSL, Chrome needs DISPLAY to show a window
    DISPLAY: process.env.DISPLAY || ":0",
    // Prevent "not a tty" errors in subprocess output
    TERM: process.env.TERM || "xterm-256color",
    // Force unbuffered output so SSE lines stream immediately
    PYTHONUNBUFFERED: "1",
  };
  return spawn(cmd, args, {
    env,
    // pipe both stdout and stderr; stdin is /dev/null (applypilot reads from DB not stdin)
    stdio: ["ignore", "pipe", "pipe"],
    // Detach slightly so Chrome's window can survive even if Next.js restarts
    detached: false,
  });
}
