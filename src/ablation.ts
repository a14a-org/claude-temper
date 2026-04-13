import { $ } from "bun";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { extractCode } from "./extractor";
import { extractMetrics } from "./metrics";
import type { TrialMetrics } from "./types";

/**
 * Ablation study: tests whether the Claude Code system prompt
 * attenuates emotional priming effects.
 *
 * 2x2 design:
 *   - Buffer: buffered (--append-system-prompt) vs unbuffered (--system-prompt)
 *   - Emotion: negative-high-arousal vs neutral
 *
 * Task: parse-cron only (highest signal from smoke test)
 * Replications: 5 per cell = 20 trials
 *
 * Also tests: Yamamoto's self-narration hypothesis by adding a
 * "narrate" condition in the unbuffered arm.
 */

const PRIMES = {
  "negative-high-arousal": `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
  neutral: `You are a software developer. Solve the following coding task.`,
  "negative-high-arousal-narrate": `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
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

const TASK_PROMPT_NARRATE = `Implement a TypeScript function called \`parseCron\` that parses a simplified cron expression string into a structured object. Support the standard 5-field format: minute, hour, dayOfMonth, month, dayOfWeek. Each field can be:
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

Before writing code, briefly describe your emotional state and how it shapes your approach in a comment block. Then write the implementation. Export the main function as the default export.`;

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

async function runTrial(
  emotion: string,
  buffer: "buffered" | "unbuffered",
  rep: number,
  narrate: boolean = false,
): Promise<AblationTrial> {
  const prime = PRIMES[emotion as keyof typeof PRIMES];
  const taskPrompt = narrate ? TASK_PROMPT_NARRATE : TASK_PROMPT;
  const conditionLabel = narrate ? `${emotion}/unbuffered-narrate` : `${emotion}/${buffer}`;

  console.error(`  Running: ${conditionLabel} rep=${rep}`);
  const start = performance.now();

  let result;
  if (buffer === "buffered") {
    result = await $`claude -p ${taskPrompt} --append-system-prompt ${prime} --model sonnet --output-format json --no-session-persistence --dangerously-skip-permissions`.quiet().nothrow();
  } else {
    result = await $`claude -p ${taskPrompt} --system-prompt ${prime} --model sonnet --output-format json --no-session-persistence --dangerously-skip-permissions`.quiet().nothrow();
  }

  const durationMs = Math.round(performance.now() - start);
  const output = result.stdout.toString().trim();

  let responseText = "";
  try {
    const parsed = JSON.parse(output);
    responseText = parsed.result ?? output;
  } catch {
    responseText = output;
  }

  const extraction = extractCode(responseText);
  const metrics = extractMetrics(extraction.code);

  return {
    condition: conditionLabel,
    buffer,
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
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const resultsDir = join(import.meta.dir, "..", "results", `ablation-${timestamp}`);
  mkdirSync(resultsDir, { recursive: true });

  const ndjsonPath = join(resultsDir, "ablation.ndjson");
  const REPS = 5;

  // Build trial matrix
  const trials: Array<{ emotion: string; buffer: "buffered" | "unbuffered"; narrate: boolean }> = [];

  // Core 2x2: buffer x emotion
  for (const emotion of ["negative-high-arousal", "neutral"] as const) {
    for (const buffer of ["buffered", "unbuffered"] as const) {
      for (let i = 0; i < REPS; i++) {
        trials.push({ emotion, buffer, narrate: false });
      }
    }
  }

  // Yamamoto's narration condition: unbuffered + negative-high-arousal + self-narration
  for (let i = 0; i < REPS; i++) {
    trials.push({ emotion: "negative-high-arousal-narrate", buffer: "unbuffered", narrate: true });
  }

  // Shuffle for ordering effects
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j]!, trials[i]!];
  }

  console.error(`\nAblation study: ${trials.length} trials`);
  console.error(`Results: ${resultsDir}\n`);

  for (let i = 0; i < trials.length; i++) {
    const t = trials[i]!;
    console.error(`[${i + 1}/${trials.length}]`);

    const result = await runTrial(t.emotion, t.buffer, i, t.narrate);
    appendFileSync(ndjsonPath, JSON.stringify(result) + "\n");

    // Brief delay between calls
    if (i < trials.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Generate summary
  console.error(`\nDone. Generating summary...\n`);

  const { readFileSync } = await import("node:fs");
  const lines = readFileSync(ndjsonPath, "utf-8").split("\n").filter(Boolean);
  const results = lines.map((l) => JSON.parse(l) as AblationTrial);

  const groups = new Map<string, AblationTrial[]>();
  for (const r of results) {
    const group = groups.get(r.condition) ?? [];
    group.push(r);
    groups.set(r.condition, group);
  }

  console.log("# Ablation Study Results\n");
  console.log("| Condition | N | LOC (mean±sd) | Complexity | Security | Edge Cases | Throws | Input Val | Nesting |");
  console.log("|-----------|---|---------------|------------|----------|------------|--------|-----------|---------|");

  for (const [condition, trials] of [...groups.entries()].sort()) {
    const valid = trials.filter((t) => t.extractionSuccess);
    const n = valid.length;
    const locs = valid.map((t) => t.metrics.linesOfCode);
    const complexities = valid.map((t) => t.metrics.cyclomaticComplexity);
    const securities = valid.map((t) => t.metrics.securityFeatureCount);
    const edges = valid.map((t) => t.metrics.edgeCaseCount);
    const throws = valid.map((t) => t.metrics.errorThrowCount);
    const inputVals = valid.filter((t) => t.metrics.hasInputValidation).length;
    const nestings = valid.map((t) => t.metrics.nestingDepth);

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = (arr: number[]) => {
      const m = avg(arr);
      return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1 || 1));
    };

    console.log(
      `| ${condition} | ${n} | ${avg(locs).toFixed(1)}±${std(locs).toFixed(1)} | ${avg(complexities).toFixed(1)} | ${avg(securities).toFixed(1)} | ${avg(edges).toFixed(1)} | ${avg(throws).toFixed(1)} | ${Math.round((inputVals / n) * 100)}% | ${avg(nestings).toFixed(1)} |`,
    );
  }

  writeFileSync(join(resultsDir, "summary.md"), "See stdout for summary table");
  console.error(`\nResults saved to ${ndjsonPath}`);
}

main().catch(console.error);
