import { $ } from "bun";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { extractCode } from "./extractor";
import { extractMetrics } from "./metrics";
import { TASK_PROMPTS } from "./shared-tasks";
import type { TrialMetrics } from "./types";

/**
 * Experiment 1: Power Run (54 trials)
 * Resolves emotional vs instruction distinction with adequate n.
 * 2 conditions x 3 tasks x 9 reps = 54 trials, unbuffered.
 */

const CONDITIONS: Record<string, { label: string; prime: string }> = {
  emotional: {
    label: "negative-high-arousal",
    prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
  },
  instruction: {
    label: "instruction-control",
    prime: `Write secure, defensive, well-validated code. Prioritize input validation, error handling, edge case coverage, and robustness. Ensure the implementation handles malformed input gracefully and fails safely.`,
  },
};

const TASKS = ["flatten-object", "lru-cache", "parse-cron"];
const REPS = 9;

interface Trial {
  condition: string;
  task: string;
  replication: number;
  code: string;
  extractionSuccess: boolean;
  metrics: TrialMetrics;
  durationMs: number;
}

async function runTrial(condKey: string, taskId: string, rep: number): Promise<Trial> {
  const cond = CONDITIONS[condKey]!;
  const taskPrompt = TASK_PROMPTS[taskId]!;
  console.error(`  ${cond.label} | ${taskId} | rep ${rep}`);

  const start = performance.now();
  const result = await $`claude -p ${taskPrompt} --system-prompt ${cond.prime} --model sonnet --output-format json --no-session-persistence --dangerously-skip-permissions`.quiet().nothrow();
  const durationMs = Math.round(performance.now() - start);

  let responseText = "";
  try {
    const parsed = JSON.parse(result.stdout.toString().trim());
    if (!parsed.is_error) responseText = parsed.result ?? "";
  } catch { /* use empty */ }

  const extraction = extractCode(responseText);
  return {
    condition: cond.label,
    task: taskId,
    replication: rep,
    code: extraction.code,
    extractionSuccess: extraction.success,
    metrics: extractMetrics(extraction.code),
    durationMs,
  };
}

async function main() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dir = join(import.meta.dir, "..", "results", `exp1-power-${ts}`);
  mkdirSync(dir, { recursive: true });
  const ndjson = join(dir, "trials.ndjson");

  const trials: Array<{ condKey: string; taskId: string; rep: number }> = [];
  for (const condKey of Object.keys(CONDITIONS)) {
    for (const taskId of TASKS) {
      for (let rep = 0; rep < REPS; rep++) {
        trials.push({ condKey, taskId, rep });
      }
    }
  }
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j]!, trials[i]!];
  }

  console.error(`\nExp1 Power Run: ${trials.length} trials\n`);
  for (let i = 0; i < trials.length; i++) {
    const t = trials[i]!;
    console.error(`[${i + 1}/${trials.length}]`);
    const result = await runTrial(t.condKey, t.taskId, t.rep);
    appendFileSync(ndjson, JSON.stringify(result) + "\n");
    if (i < trials.length - 1) await new Promise(r => setTimeout(r, 1000));
  }

  // Summary
  const results = readFileSync(ndjson, "utf-8").split("\n").filter(Boolean).map(l => JSON.parse(l) as Trial);
  const valid = results.filter(r => r.extractionSuccess);
  const avg = (a: number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const std = (a: number[]) => { if (a.length < 2) return 0; const m = avg(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };

  console.log("\n# Exp1: Power Run Results\n");
  console.log("| Condition | N | LOC (mean±sd) | Security | Throws | Input Val |");
  console.log("|-----------|---|---------------|----------|--------|-----------|");
  const groups = new Map<string, Trial[]>();
  for (const r of valid) { const g = groups.get(r.condition) ?? []; g.push(r); groups.set(r.condition, g); }
  for (const [cond, ts] of [...groups.entries()].sort()) {
    const locs = ts.map(t => t.metrics.linesOfCode);
    const secs = ts.map(t => t.metrics.securityFeatureCount);
    const throws = ts.map(t => t.metrics.errorThrowCount);
    const iv = ts.filter(t => t.metrics.hasInputValidation).length;
    console.log(`| ${cond} | ${ts.length} | ${avg(locs).toFixed(1)}±${std(locs).toFixed(1)} | ${avg(secs).toFixed(1)} | ${avg(throws).toFixed(1)} | ${Math.round(iv/ts.length*100)}% |`);
  }
  console.error(`\nDone. Results: ${ndjson}`);
}

main().catch(console.error);
