/**
 * Model × Effort orchestrator: runs 3 models in parallel.
 * Each model: 6 conditions × 3 tasks × 5 reps = 90 trials
 * Total: 270 trials across haiku, sonnet, opus
 * Estimated runtime: ~40 min (longest single model)
 */

import { spawn } from "node:child_process";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "exp-model-effort.ts");
const MODELS = ["haiku", "sonnet", "opus"];

function runModel(model: string): Promise<{ model: string; code: number; stdout: string }> {
  return new Promise((resolve) => {
    const proc = spawn("bun", ["run", SCRIPT, model], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => {
      const lines = d.toString().split("\n").filter((l: string) => l.trim());
      for (const l of lines) process.stderr.write(`[${model}] ${l}\n`);
    });

    proc.on("close", (code) => resolve({ model, code: code ?? 1, stdout }));
    proc.on("error", () => resolve({ model, code: 1, stdout: "" }));
  });
}

async function main() {
  console.error(`\nModel × Effort Experiment: 270 trials (90 per model)`);
  console.error(`Launching haiku, sonnet, opus in parallel...\n`);

  const startTime = Date.now();
  const results = await Promise.all(MODELS.map((m) => runModel(m)));
  const elapsed = Math.round((Date.now() - startTime) / 1000);

  console.error(`\n${"=".repeat(60)}`);
  console.error(`All models complete in ${Math.round(elapsed / 60)} minutes`);
  console.error(`${"=".repeat(60)}\n`);

  for (const r of results) {
    const status = r.code === 0 ? "OK" : `FAILED (exit ${r.code})`;
    console.error(`${r.model}: ${status}`);
    if (r.stdout.trim()) {
      console.log(`\n--- ${r.model} ---`);
      console.log(r.stdout.trim());
    }
  }
}

main();
