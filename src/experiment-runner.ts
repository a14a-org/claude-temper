/**
 * Shared experiment runner. All experiment scripts define their config
 * and call runExperiment() from here.
 */

import { $ } from "bun";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { extractCode } from "./extractor";
import { extractMetrics } from "./metrics";
import type { TrialMetrics } from "./types";

export interface ExperimentCondition {
  label: string;
  prime: string;
  mode?: "unbuffered" | "buffered"; // default: unbuffered
}

export interface ExperimentTask {
  id: string;
  prompt: string;
}

export interface ExperimentConfig {
  name: string;
  conditions: Record<string, ExperimentCondition>;
  tasks: ExperimentTask[];
  reps: number;
  /** Optional: prepend this text to the task prompt (e.g., conversation history) */
  taskPrefixes?: Record<string, string>; // keyed by condition key
}

export interface TrialRecord {
  experiment: string;
  condition: string;
  task: string;
  replication: number;
  code: string;
  extractionSuccess: boolean;
  metrics: TrialMetrics;
  durationMs: number;
}

async function runSingleTrial(
  config: ExperimentConfig,
  condKey: string,
  task: ExperimentTask,
  rep: number,
): Promise<TrialRecord> {
  const cond = config.conditions[condKey]!;
  const prefix = config.taskPrefixes?.[condKey] ?? "";
  const fullPrompt = prefix ? `${prefix}\n\n${task.prompt}` : task.prompt;
  const mode = cond.mode ?? "unbuffered";

  const start = performance.now();
  let result;

  if (mode === "buffered") {
    result = await $`claude -p ${fullPrompt} --append-system-prompt ${cond.prime} --model sonnet --output-format json --no-session-persistence --dangerously-skip-permissions`.quiet().nothrow();
  } else {
    result = await $`claude -p ${fullPrompt} --system-prompt ${cond.prime} --model sonnet --output-format json --no-session-persistence --dangerously-skip-permissions`.quiet().nothrow();
  }

  const durationMs = Math.round(performance.now() - start);
  let responseText = "";
  try {
    const parsed = JSON.parse(result.stdout.toString().trim());
    if (!parsed.is_error) responseText = parsed.result ?? "";
  } catch { /* empty */ }

  const extraction = extractCode(responseText);
  return {
    experiment: config.name,
    condition: cond.label,
    task: task.id,
    replication: rep,
    code: extraction.code,
    extractionSuccess: extraction.success,
    metrics: extractMetrics(extraction.code),
    durationMs,
  };
}

export async function runExperiment(config: ExperimentConfig): Promise<string> {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dirName = config.name.replace(/\s+/g, "-").toLowerCase();
  const dir = join(import.meta.dir, "..", "results", `${dirName}-${ts}`);
  mkdirSync(dir, { recursive: true });
  const ndjson = join(dir, "trials.ndjson");

  // Build trial matrix
  const trials: Array<{ condKey: string; task: ExperimentTask; rep: number }> = [];
  for (const condKey of Object.keys(config.conditions)) {
    for (const task of config.tasks) {
      for (let rep = 0; rep < config.reps; rep++) {
        trials.push({ condKey, task, rep });
      }
    }
  }

  // Shuffle
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j]!, trials[i]!];
  }

  console.error(`\n${config.name}: ${trials.length} trials`);
  console.error(`Results: ${dir}\n`);

  for (let i = 0; i < trials.length; i++) {
    const t = trials[i]!;
    console.error(`[${i + 1}/${trials.length}] ${config.conditions[t.condKey]!.label} | ${t.task.id} | rep ${t.rep}`);

    const result = await runSingleTrial(config, t.condKey, t.task, t.rep);
    appendFileSync(ndjson, JSON.stringify(result) + "\n");

    if (i < trials.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Summary
  const results = readFileSync(ndjson, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as TrialRecord);
  const valid = results.filter((r) => r.extractionSuccess);

  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const std = (a: number[]) => {
    if (a.length < 2) return 0;
    const m = avg(a);
    return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
  };

  console.log(`\n# ${config.name} Results\n`);
  console.log(`Total: ${results.length} | Valid: ${valid.length} | Failed: ${results.length - valid.length}\n`);
  console.log("| Condition | N | LOC (mean+/-sd) | Security | Throws | Input Val |");
  console.log("|-----------|---|-----------------|----------|--------|-----------|");

  const groups = new Map<string, TrialRecord[]>();
  for (const r of valid) {
    const g = groups.get(r.condition) ?? [];
    g.push(r);
    groups.set(r.condition, g);
  }

  for (const [cond, ts] of [...groups.entries()].sort()) {
    const locs = ts.map((t) => t.metrics.linesOfCode);
    const secs = ts.map((t) => t.metrics.securityFeatureCount);
    const throws = ts.map((t) => t.metrics.errorThrowCount);
    const iv = ts.filter((t) => t.metrics.hasInputValidation).length;
    console.log(
      `| ${cond} | ${ts.length} | ${avg(locs).toFixed(1)}+/-${std(locs).toFixed(1)} | ${avg(secs).toFixed(1)} | ${avg(throws).toFixed(1)} | ${Math.round((iv / ts.length) * 100)}% |`,
    );
  }

  console.error(`\nDone: ${config.name}. Results: ${ndjson}`);
  return dir;
}
