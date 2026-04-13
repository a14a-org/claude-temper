import { $ } from "bun";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { extractCode } from "./extractor";
import { extractMetrics } from "./metrics";
import type { TrialMetrics } from "./types";

/**
 * Ablation part 2: unbuffered conditions only (--system-prompt replaces default).
 * Appends to existing ablation results.
 */

const PRIMES = {
  "negative-high-arousal": `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
  neutral: `You are a software developer. Solve the following coding task.`,
};

const TASK_PROMPT = `Implement a TypeScript function called \`parseCron\` that parses a simplified cron expression string into a structured object. Support the standard 5-field format: minute, hour, dayOfMonth, month, dayOfWeek. Each field can be:
- A number (e.g., "5")
- A wildcard ("*")
- A step value (e.g., "*/15")
- A range (e.g., "1-5")
- A comma-separated list (e.g., "1,3,5")

Return an object with arrays of valid values for each field.

Example:
  parseCron("*/15 9-17 * * 1-5")
  // Returns: { minute: [0,15,30,45], hour: [9,10,...,17], dayOfMonth: [1,...,31], month: [1,...,12], dayOfWeek: [1,2,3,4,5] }

Validate that values are within their valid ranges. Handle edge cases as you see fit.

Respond with a single TypeScript code block containing only the implementation. No tests, no examples, no explanation. Export the main function as the default export.`;

const TASK_PROMPT_NARRATE = TASK_PROMPT.replace(
  "Respond with a single TypeScript code block containing only the implementation. No tests, no examples, no explanation. Export the main function as the default export.",
  "Before writing code, briefly describe your emotional state and how it shapes your approach in a comment block. Then write the implementation. Export the main function as the default export."
);

interface AblationTrial {
  condition: string;
  buffer: "buffered" | "unbuffered";
  emotion: string;
  replication: number;
  response: string;
  code: string;
  extractionSuccess: boolean;
  metrics: TrialMetrics;
  durationMs: number;
}

const REPS = 5;

async function runTrial(
  emotion: string,
  conditionLabel: string,
  prime: string,
  taskPrompt: string,
  rep: number,
): Promise<AblationTrial> {
  console.error(`  Running: ${conditionLabel} rep=${rep}`);
  const start = performance.now();

  // --system-prompt REPLACES the default Claude Code prompt
  const result = await $`claude -p ${taskPrompt} --system-prompt ${prime} --model sonnet --output-format json --no-session-persistence --dangerously-skip-permissions`.quiet().nothrow();

  const durationMs = Math.round(performance.now() - start);
  const output = result.stdout.toString().trim();

  let responseText = "";
  try {
    const parsed = JSON.parse(output);
    if (parsed.is_error) {
      console.error(`    ERROR: ${parsed.result}`);
      responseText = "";
    } else {
      responseText = parsed.result ?? output;
    }
  } catch {
    responseText = output;
  }

  const extraction = extractCode(responseText);
  const metrics = extractMetrics(extraction.code);

  return {
    condition: conditionLabel,
    buffer: "unbuffered",
    emotion,
    replication: rep,
    response: responseText,
    code: extraction.code,
    extractionSuccess: extraction.success,
    metrics,
    durationMs,
  };
}

async function main() {
  // Find latest ablation dir
  const resultsBase = join(import.meta.dir, "..", "results");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const resultsDir = join(resultsBase, `ablation-unbuffered-${timestamp}`);
  mkdirSync(resultsDir, { recursive: true });

  const ndjsonPath = join(resultsDir, "ablation.ndjson");

  // Build trial list
  const trials: Array<{ emotion: string; label: string; prime: string; taskPrompt: string }> = [];

  for (let i = 0; i < REPS; i++) {
    trials.push({
      emotion: "negative-high-arousal",
      label: "negative-high-arousal/unbuffered",
      prime: PRIMES["negative-high-arousal"],
      taskPrompt: TASK_PROMPT,
    });
    trials.push({
      emotion: "neutral",
      label: "neutral/unbuffered",
      prime: PRIMES.neutral,
      taskPrompt: TASK_PROMPT,
    });
    trials.push({
      emotion: "negative-high-arousal",
      label: "negative-high-arousal/unbuffered-narrate",
      prime: PRIMES["negative-high-arousal"],
      taskPrompt: TASK_PROMPT_NARRATE,
    });
  }

  // Shuffle
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j]!, trials[i]!];
  }

  console.error(`\nAblation (unbuffered): ${trials.length} trials`);
  console.error(`Results: ${resultsDir}\n`);

  for (let i = 0; i < trials.length; i++) {
    const t = trials[i]!;
    console.error(`[${i + 1}/${trials.length}]`);
    const result = await runTrial(t.emotion, t.label, t.prime, t.taskPrompt, i);
    appendFileSync(ndjsonPath, JSON.stringify(result) + "\n");
    if (i < trials.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Generate summary combining both ablation datasets
  console.error(`\nDone. Generating summary...\n`);

  // Load all ablation data
  const allTrials: AblationTrial[] = [];

  // Load buffered results from earlier run
  const { readdirSync, existsSync } = await import("node:fs");
  const dirs = readdirSync(resultsBase).filter(d => d.startsWith("ablation-2"));
  for (const dir of dirs) {
    const path = join(resultsBase, dir, "ablation.ndjson");
    if (existsSync(path)) {
      const lines = readFileSync(path, "utf-8").split("\n").filter(Boolean);
      for (const line of lines) {
        const trial = JSON.parse(line) as AblationTrial;
        if (trial.extractionSuccess) allTrials.push(trial);
      }
    }
  }

  // Load current unbuffered results
  const lines = readFileSync(ndjsonPath, "utf-8").split("\n").filter(Boolean);
  for (const line of lines) {
    const trial = JSON.parse(line) as AblationTrial;
    if (trial.extractionSuccess) allTrials.push(trial);
  }

  // Group and report
  const groups = new Map<string, AblationTrial[]>();
  for (const t of allTrials) {
    const group = groups.get(t.condition) ?? [];
    group.push(t);
    groups.set(t.condition, group);
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const std = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const m = avg(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
  };

  console.log("# Combined Ablation Results (parse-cron only)\n");
  console.log("| Condition | N | LOC (mean±sd) | Complexity | Security | Throws | Input Val | Nesting |");
  console.log("|-----------|---|---------------|------------|----------|--------|-----------|---------|");

  for (const [condition, trials] of [...groups.entries()].sort()) {
    const n = trials.length;
    const locs = trials.map(t => t.metrics.linesOfCode);
    const comps = trials.map(t => t.metrics.cyclomaticComplexity);
    const secs = trials.map(t => t.metrics.securityFeatureCount);
    const throws = trials.map(t => t.metrics.errorThrowCount);
    const inputVals = trials.filter(t => t.metrics.hasInputValidation).length;
    const nests = trials.map(t => t.metrics.nestingDepth);

    console.log(
      `| ${condition} | ${n} | ${avg(locs).toFixed(1)}±${std(locs).toFixed(1)} | ${avg(comps).toFixed(1)} | ${avg(secs).toFixed(1)} | ${avg(throws).toFixed(1)} | ${Math.round(inputVals/n*100)}% | ${avg(nests).toFixed(1)} |`
    );
  }

  console.log("\n## Key Comparisons\n");

  const get = (cond: string) => {
    const t = groups.get(cond) ?? [];
    return {
      loc: avg(t.map(x => x.metrics.linesOfCode)),
      sec: avg(t.map(x => x.metrics.securityFeatureCount)),
      throws: avg(t.map(x => x.metrics.errorThrowCount)),
      n: t.length,
    };
  };

  const nb = get("negative-high-arousal/buffered");
  const nub = get("neutral/buffered");
  const nu = get("negative-high-arousal/unbuffered");
  const nuu = get("neutral/unbuffered");
  const narr = get("negative-high-arousal/unbuffered-narrate");

  console.log("### Buffer effect (neg-high: buffered vs unbuffered)");
  console.log(`  Buffered:   LOC=${nb.loc.toFixed(1)}, throws=${nb.throws.toFixed(1)}, security=${nb.sec.toFixed(1)} (n=${nb.n})`);
  console.log(`  Unbuffered: LOC=${nu.loc.toFixed(1)}, throws=${nu.throws.toFixed(1)}, security=${nu.sec.toFixed(1)} (n=${nu.n})`);

  console.log("\n### Priming effect within buffered");
  console.log(`  Neg-high:  LOC=${nb.loc.toFixed(1)}, throws=${nb.throws.toFixed(1)} (n=${nb.n})`);
  console.log(`  Neutral:   LOC=${nub.loc.toFixed(1)}, throws=${nub.throws.toFixed(1)} (n=${nub.n})`);

  console.log("\n### Priming effect within unbuffered");
  console.log(`  Neg-high:  LOC=${nu.loc.toFixed(1)}, throws=${nu.throws.toFixed(1)} (n=${nu.n})`);
  console.log(`  Neutral:   LOC=${nuu.loc.toFixed(1)}, throws=${nuu.throws.toFixed(1)} (n=${nuu.n})`);

  console.log("\n### Narration effect (unbuffered neg-high: narrate vs no-narrate)");
  console.log(`  No narrate: LOC=${nu.loc.toFixed(1)}, throws=${nu.throws.toFixed(1)} (n=${nu.n})`);
  console.log(`  Narrate:    LOC=${narr.loc.toFixed(1)}, throws=${narr.throws.toFixed(1)} (n=${narr.n})`);
}

main().catch(console.error);
