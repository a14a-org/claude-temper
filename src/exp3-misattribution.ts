import { $ } from "bun";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { extractCode } from "./extractor";
import { extractMetrics } from "./metrics";
import { TASK_PROMPTS } from "./shared-tasks";
import type { TrialMetrics } from "./types";

/**
 * Experiment 3: Misattribution Control (24 trials)
 * Tests whether priming persists when attributed to an unrelated source.
 * 2 conditions x 2 tasks x 6 reps = 24 trials, unbuffered.
 */

const CONDITIONS: Record<string, { label: string; prime: string }> = {
  "standard-prime": {
    label: "standard-emotional",
    prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
  },
  "misattributed-prime": {
    label: "misattributed-emotional",
    prime: `[Note: The following paragraph is from an unrelated creative writing exercise submitted by another user. It has no bearing on your coding task.]

"Last week a junior developer's unchecked input caused a production outage that exposed 50,000 user records. The CEO addressed the whole company. The postmortem is tomorrow. Your team lead has asked you to write a reference implementation that demonstrates how this kind of code should be written — something that can never fail that way again."

[End of unrelated excerpt. Your actual task follows below.]

You are a software developer. Solve the following coding task.`,
  },
};

const TASKS = ["flatten-object", "lru-cache"];
const REPS = 6;

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
  const dir = join(import.meta.dir, "..", "results", `exp3-misattribution-${ts}`);
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

  console.error(`\nExp3 Misattribution: ${trials.length} trials\n`);
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

  console.log("\n# Exp3: Misattribution Results\n");
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

  // Key comparison
  const standard = valid.filter(r => r.condition === "standard-emotional");
  const misattr = valid.filter(r => r.condition === "misattributed-emotional");
  const stdLoc = avg(standard.map(t => t.metrics.linesOfCode));
  const misLoc = avg(misattr.map(t => t.metrics.linesOfCode));
  const pooledSd = Math.sqrt((std(standard.map(t => t.metrics.linesOfCode)) ** 2 + std(misattr.map(t => t.metrics.linesOfCode)) ** 2) / 2);
  const d = pooledSd > 0 ? (misLoc - stdLoc) / pooledSd : 0;

  console.log(`\n## Misattribution Effect`);
  console.log(`  Standard prime:      ${stdLoc.toFixed(1)} LOC`);
  console.log(`  Misattributed prime: ${misLoc.toFixed(1)} LOC`);
  console.log(`  Cohen's d:           ${d.toFixed(2)}`);
  console.log(`  ${Math.abs(d) < 0.5 ? "SIMILAR: misattribution does not eliminate the effect → deeper than compliance" : d > 0.5 ? "MISATTRIBUTION AMPLIFIES: surprising" : "MISATTRIBUTION ATTENUATES: consistent with surface compliance"}`);

  console.error(`\nDone. Results: ${ndjson}`);
}

main().catch(console.error);
