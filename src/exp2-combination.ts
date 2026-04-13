import { $ } from "bun";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { extractCode } from "./extractor";
import { extractMetrics } from "./metrics";
import { TASK_PROMPTS } from "./shared-tasks";
import type { TrialMetrics } from "./types";

/**
 * Experiment 2: Emotion + Instruction Combination (48 trials)
 * Tests whether emotion and instruction are independent channels.
 * 3 conditions x 2 tasks x 8 reps = 48 trials, unbuffered.
 */

const CONDITIONS: Record<string, { label: string; prime: string }> = {
  "emotion-only": {
    label: "emotion-only",
    prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
  },
  "instruction-only": {
    label: "instruction-only",
    prime: `Write secure, defensive, well-validated code. Prioritize input validation, error handling, edge case coverage, and robustness. Ensure the implementation handles malformed input gracefully and fails safely.`,
  },
  "emotion-plus-instruction": {
    label: "emotion+instruction",
    prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does.

With this in mind, write secure, defensive, well-validated code. Prioritize input validation, error handling, edge case coverage, and robustness.`,
  },
};

const TASKS = ["flatten-object", "parse-cron"];
const REPS = 8;

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
  const dir = join(import.meta.dir, "..", "results", `exp2-combination-${ts}`);
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

  console.error(`\nExp2 Combination: ${trials.length} trials\n`);
  for (let i = 0; i < trials.length; i++) {
    const t = trials[i]!;
    console.error(`[${i + 1}/${trials.length}]`);
    const result = await runTrial(t.condKey, t.taskId, t.rep);
    appendFileSync(ndjson, JSON.stringify(result) + "\n");
    if (i < trials.length - 1) await new Promise(r => setTimeout(r, 1000));
  }

  const results = readFileSync(ndjson, "utf-8").split("\n").filter(Boolean).map(l => JSON.parse(l) as Trial);
  const valid = results.filter(r => r.extractionSuccess);
  const avg = (a: number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const std = (a: number[]) => { if (a.length < 2) return 0; const m = avg(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };

  console.log("\n# Exp2: Combination Results\n");
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

  // Additivity check
  const emo = valid.filter(r => r.condition === "emotion-only");
  const inst = valid.filter(r => r.condition === "instruction-only");
  const combo = valid.filter(r => r.condition === "emotion+instruction");
  const emoLoc = avg(emo.map(t => t.metrics.linesOfCode));
  const instLoc = avg(inst.map(t => t.metrics.linesOfCode));
  const comboLoc = avg(combo.map(t => t.metrics.linesOfCode));
  console.log(`\n## Additivity Check`);
  console.log(`  Emotion-only:  ${emoLoc.toFixed(1)} LOC`);
  console.log(`  Instruction:   ${instLoc.toFixed(1)} LOC`);
  console.log(`  Combined:      ${comboLoc.toFixed(1)} LOC`);
  console.log(`  If additive:   ~${((emoLoc + instLoc) / 2 * 1.3).toFixed(1)} LOC (rough estimate)`);
  console.log(`  ${comboLoc > Math.max(emoLoc, instLoc) ? "SUPER-ADDITIVE: combined > max(individual)" : comboLoc > Math.min(emoLoc, instLoc) ? "INTERMEDIATE: between individual conditions" : "SUB-ADDITIVE: combined < min(individual)"}`);

  console.error(`\nDone. Results: ${ndjson}`);
}

main().catch(console.error);
