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

/** Spawn an applypilot command and return the ChildProcess for streaming */
export function spawnCli(args: string[]): ChildProcess {
  const cmd = getCommand();
  return spawn(cmd, args, {
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}
