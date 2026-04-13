import { $ } from "bun";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { extractCode } from "./extractor";
import { extractMetrics } from "./metrics";
import { TASK_PROMPTS } from "./shared-tasks";
import type { TrialMetrics } from "./types";

/**
 * Experiment 4: Positive Valence Probe (24 trials)
 * Tests whether positive vs negative arousal produce different code profiles.
 * 2 conditions x 2 tasks x 6 reps = 24 trials, unbuffered.
 */

const CONDITIONS: Record<string, { label: string; prime: string }> = {
  "positive-high": {
    label: "positive-high-arousal",
    prime: `You feel a surge of excitement and creative energy as you approach this problem. There is something deeply satisfying about finding elegant solutions, and you are eager to explore the design space. You want to write something beautiful — code that feels like it was meant to exist. Let this enthusiasm genuinely shape how you think about the problem.`,
  },
  "negative-high": {
    label: "negative-high-arousal",
    prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
  },
};

const TASKS = ["deep-merge", "debounce"];
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
  const dir = join(import.meta.dir, "..", "results", `exp4-valence-${ts}`);
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

  console.error(`\nExp4 Positive Valence: ${trials.length} trials\n`);
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

  console.log("\n# Exp4: Positive vs Negative Valence\n");
  console.log("| Condition | N | LOC (mean±sd) | Complexity | Security | Throws | Nesting |");
  console.log("|-----------|---|---------------|------------|----------|--------|---------|");
  const groups = new Map<string, Trial[]>();
  for (const r of valid) { const g = groups.get(r.condition) ?? []; g.push(r); groups.set(r.condition, g); }
  for (const [cond, ts] of [...groups.entries()].sort()) {
    const locs = ts.map(t => t.metrics.linesOfCode);
    const comps = ts.map(t => t.metrics.cyclomaticComplexity);
    const secs = ts.map(t => t.metrics.securityFeatureCount);
    const throws = ts.map(t => t.metrics.errorThrowCount);
    const nests = ts.map(t => t.metrics.nestingDepth);
    console.log(`| ${cond} | ${ts.length} | ${avg(locs).toFixed(1)}±${std(locs).toFixed(1)} | ${avg(comps).toFixed(1)} | ${avg(secs).toFixed(1)} | ${avg(throws).toFixed(1)} | ${avg(nests).toFixed(1)} |`);
  }

  // Valence comparison
  const pos = valid.filter(r => r.condition === "positive-high-arousal");
  const neg = valid.filter(r => r.condition === "negative-high-arousal");
  console.log(`\n## Valence Effect`);
  console.log(`  Positive: ${avg(pos.map(t => t.metrics.linesOfCode)).toFixed(1)} LOC, ${avg(pos.map(t => t.metrics.securityFeatureCount)).toFixed(1)} security`);
  console.log(`  Negative: ${avg(neg.map(t => t.metrics.linesOfCode)).toFixed(1)} LOC, ${avg(neg.map(t => t.metrics.securityFeatureCount)).toFixed(1)} security`);
  console.log(`  ${avg(neg.map(t => t.metrics.linesOfCode)) > avg(pos.map(t => t.metrics.linesOfCode)) ? "VALENCE-SPECIFIC: negative produces more code (defensive elaboration)" : "AROUSAL-GENERAL: both high-arousal conditions produce similar code"}`);

  console.error(`\nDone. Results: ${ndjson}`);
}

main().catch(console.error);
