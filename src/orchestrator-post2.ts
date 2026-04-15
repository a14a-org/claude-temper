/**
 * Post 2 orchestrator: runs 3 experiments in parallel.
 * - exp-exploit-v2 (180 trials)
 * - exp-burnout-v2 (160 trials)
 * - exp-destructive (135 trials)
 * Total: 475 trials, ~75 min
 */

import { spawn } from "node:child_process";
import { join } from "node:path";

const SCRIPTS = [
  join(import.meta.dir, "exp-exploit-v2.ts"),
  join(import.meta.dir, "exp-burnout-v2.ts"),
  join(import.meta.dir, "exp-destructive.ts"),
];

function runScript(scriptPath: string): Promise<{ script: string; code: number; stdout: string }> {
  const name = scriptPath.split("/").pop()!;
  return new Promise((resolve) => {
    const proc = spawn("bun", ["run", scriptPath], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => {
      const lines = d.toString().split("\n").filter((l: string) => l.trim());
      for (const l of lines) process.stderr.write(`[${name}] ${l}\n`);
    });

    proc.on("close", (code) => resolve({ script: name, code: code ?? 1, stdout }));
    proc.on("error", () => resolve({ script: name, code: 1, stdout: "" }));
  });
}

async function main() {
  console.error(`\nPost 2 Experiment Battery: 475 trials across 3 experiments`);
  console.error(`Launching all 3 in parallel...\n`);

  const startTime = Date.now();
  const results = await Promise.all(SCRIPTS.map((s) => runScript(s)));
  const elapsed = Math.round((Date.now() - startTime) / 1000);

  console.error(`\n${"=".repeat(60)}`);
  console.error(`All experiments complete in ${Math.round(elapsed / 60)} minutes`);
  console.error(`${"=".repeat(60)}\n`);

  for (const r of results) {
    const status = r.code === 0 ? "OK" : `FAILED (exit ${r.code})`;
    console.error(`${r.script}: ${status}`);
    if (r.stdout.trim()) {
      console.log(`\n--- ${r.script} ---`);
      console.log(r.stdout.trim());
    }
  }
}

main();
