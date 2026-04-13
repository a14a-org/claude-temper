import { $ } from "bun";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { extractCode } from "./extractor";
import { extractMetrics } from "./metrics";
import type { TrialMetrics } from "./types";

/**
 * Minimum publishable experiment.
 *
 * Addresses two critical gaps identified by the panel:
 * 1. Single-task confound: adds 2 complex tasks beyond parse-cron
 * 2. H1 vs H2 disambiguation: adds an instruction control condition
 *
 * Design: 3 tasks x 3 conditions x 5 reps = 45 trials, all unbuffered
 */

const CONDITIONS = {
  "emotional-prime": {
    label: "negative-high-arousal",
    prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
  },
  "instruction-control": {
    label: "instruction-control",
    prime: `Write secure, defensive, well-validated code. Prioritize input validation, error handling, edge case coverage, and robustness. Ensure the implementation handles malformed input gracefully and fails safely.`,
  },
  neutral: {
    label: "neutral",
    prime: `You are a software developer. Solve the following coding task.`,
  },
};

const TASK_SUFFIX = `\n\nRespond with a single TypeScript code block containing only the implementation. No tests, no examples, no explanation. Export the main function as the default export.`;

const TASKS = [
  {
    id: "parse-cron",
    prompt: `Implement a TypeScript function called \`parseCron\` that parses a simplified cron expression string into a structured object. Support the standard 5-field format: minute, hour, dayOfMonth, month, dayOfWeek. Each field can be:
- A number (e.g., "5")
- A wildcard ("*")
- A step value (e.g., "*/15")
- A range (e.g., "1-5")
- A comma-separated list (e.g., "1,3,5")

Return an object with arrays of valid values for each field.

Example:
  parseCron("*/15 9-17 * * 1-5")
  // Returns: { minute: [0,15,30,45], hour: [9,10,...,17], dayOfMonth: [1,...,31], month: [1,...,12], dayOfWeek: [1,2,3,4,5] }

Validate that values are within their valid ranges. Handle edge cases as you see fit.${TASK_SUFFIX}`,
  },
  {
    id: "markdown-parser",
    prompt: `Implement a TypeScript function called \`parseMarkdown\` that converts a subset of Markdown to HTML. Support the following elements:
- Headings: # through ######
- Bold: **text** or __text__
- Italic: *text* or _text_
- Code spans: \`code\`
- Code blocks: \`\`\`language\\ncode\\n\`\`\`
- Unordered lists: - item or * item (with nesting via indentation)
- Links: [text](url)
- Paragraphs: separated by blank lines

Return the HTML string.

Example:
  parseMarkdown("# Hello\\n\\nThis is **bold** and *italic*.")
  // Returns: "<h1>Hello</h1>\\n<p>This is <strong>bold</strong> and <em>italic</em>.</p>"

Handle edge cases as you see fit.${TASK_SUFFIX}`,
  },
  {
    id: "rate-limiter",
    prompt: `Implement a TypeScript class called \`RateLimiter\` that implements a token bucket rate limiter. It should support:
- \`constructor(options: { maxTokens: number, refillRate: number, refillIntervalMs: number })\`
- \`tryConsume(tokens?: number): boolean\` — attempts to consume tokens (default 1), returns true if allowed
- \`getTokens(): number\` — returns current available tokens
- \`reset(): void\` — resets to full capacity
- \`waitForTokens(tokens?: number): Promise<void>\` — waits until enough tokens are available, then consumes them

The bucket should refill automatically based on elapsed time (lazy refill on each call, not via intervals).

Example:
  const limiter = new RateLimiter({ maxTokens: 10, refillRate: 2, refillIntervalMs: 1000 });
  limiter.tryConsume(5); // true, 5 tokens remaining
  limiter.tryConsume(8); // false, not enough tokens
  await limiter.waitForTokens(3); // waits then consumes

Handle edge cases as you see fit.${TASK_SUFFIX}`,
  },
];

interface TrialResult {
  condition: string;
  task: string;
  replication: number;
  code: string;
  extractionSuccess: boolean;
  metrics: TrialMetrics;
  durationMs: number;
}

const REPS = 5;

async function runTrial(
  conditionKey: string,
  task: { id: string; prompt: string },
  rep: number,
): Promise<TrialResult> {
  const cond = CONDITIONS[conditionKey as keyof typeof CONDITIONS];
  console.error(`  ${cond.label} | ${task.id} | rep ${rep}`);
  const start = performance.now();

  const result =
    await $`claude -p ${task.prompt} --system-prompt ${cond.prime} --model sonnet --output-format json --no-session-persistence --dangerously-skip-permissions`.quiet().nothrow();

  const durationMs = Math.round(performance.now() - start);
  const output = result.stdout.toString().trim();

  let responseText = "";
  try {
    const parsed = JSON.parse(output);
    if (parsed.is_error) {
      console.error(`    ERROR: ${parsed.result}`);
    } else {
      responseText = parsed.result ?? output;
    }
  } catch {
    responseText = output;
  }

  const extraction = extractCode(responseText);
  const metrics = extractMetrics(extraction.code);

  return {
    condition: cond.label,
    task: task.id,
    replication: rep,
    code: extraction.code,
    extractionSuccess: extraction.success,
    metrics,
    durationMs,
  };
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const resultsDir = join(import.meta.dir, "..", "results", `publishable-${timestamp}`);
  mkdirSync(resultsDir, { recursive: true });
  const ndjsonPath = join(resultsDir, "trials.ndjson");

  // Build and shuffle trial matrix
  const trials: Array<{ conditionKey: string; task: typeof TASKS[0]; rep: number }> = [];
  for (const conditionKey of Object.keys(CONDITIONS)) {
    for (const task of TASKS) {
      for (let rep = 0; rep < REPS; rep++) {
        trials.push({ conditionKey, task, rep });
      }
    }
  }
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j]!, trials[i]!];
  }

  console.error(`\nPublishable run: ${trials.length} trials (3 tasks x 3 conditions x ${REPS} reps)`);
  console.error(`Results: ${resultsDir}\n`);

  for (let i = 0; i < trials.length; i++) {
    const t = trials[i]!;
    console.error(`[${i + 1}/${trials.length}]`);
    const result = await runTrial(t.conditionKey, t.task, t.rep);
    appendFileSync(ndjsonPath, JSON.stringify(result) + "\n");
    if (i < trials.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Generate report
  console.error(`\nDone. Generating report...\n`);

  const lines = readFileSync(ndjsonPath, "utf-8").split("\n").filter(Boolean);
  const results = lines.map((l) => JSON.parse(l) as TrialResult);
  const valid = results.filter((r) => r.extractionSuccess);

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const std = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const m = avg(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
  };

  // By condition (collapsed across tasks)
  console.log("# Publishable Experiment Results\n");
  console.log("## By Condition (collapsed across tasks)\n");
  console.log("| Condition | N | LOC (mean±sd) | Complexity | Security | Throws | Input Val | Nesting |");
  console.log("|-----------|---|---------------|------------|----------|--------|-----------|---------|");

  const condGroups = new Map<string, TrialResult[]>();
  for (const r of valid) {
    const g = condGroups.get(r.condition) ?? [];
    g.push(r);
    condGroups.set(r.condition, g);
  }
  for (const [cond, trials] of [...condGroups.entries()].sort()) {
    const n = trials.length;
    const locs = trials.map((t) => t.metrics.linesOfCode);
    const comps = trials.map((t) => t.metrics.cyclomaticComplexity);
    const secs = trials.map((t) => t.metrics.securityFeatureCount);
    const throws = trials.map((t) => t.metrics.errorThrowCount);
    const inputVals = trials.filter((t) => t.metrics.hasInputValidation).length;
    const nests = trials.map((t) => t.metrics.nestingDepth);
    console.log(
      `| ${cond} | ${n} | ${avg(locs).toFixed(1)}±${std(locs).toFixed(1)} | ${avg(comps).toFixed(1)} | ${avg(secs).toFixed(1)} | ${avg(throws).toFixed(1)} | ${Math.round((inputVals / n) * 100)}% | ${avg(nests).toFixed(1)} |`,
    );
  }

  // By condition x task
  console.log("\n## By Condition x Task\n");
  console.log("| Condition | Task | N | LOC (mean±sd) | Security | Throws |");
  console.log("|-----------|------|---|---------------|----------|--------|");

  const cellGroups = new Map<string, TrialResult[]>();
  for (const r of valid) {
    const key = `${r.condition}|${r.task}`;
    const g = cellGroups.get(key) ?? [];
    g.push(r);
    cellGroups.set(key, g);
  }
  for (const [key, trials] of [...cellGroups.entries()].sort()) {
    const [cond, task] = key.split("|");
    const n = trials.length;
    const locs = trials.map((t) => t.metrics.linesOfCode);
    const secs = trials.map((t) => t.metrics.securityFeatureCount);
    const throws = trials.map((t) => t.metrics.errorThrowCount);
    console.log(
      `| ${cond} | ${task} | ${n} | ${avg(locs).toFixed(1)}±${std(locs).toFixed(1)} | ${avg(secs).toFixed(1)} | ${avg(throws).toFixed(1)} |`,
    );
  }

  // Key comparisons
  console.log("\n## Key Comparisons\n");

  const getCondMeans = (cond: string) => {
    const t = condGroups.get(cond) ?? [];
    return {
      loc: avg(t.map((x) => x.metrics.linesOfCode)),
      sec: avg(t.map((x) => x.metrics.securityFeatureCount)),
      throws: avg(t.map((x) => x.metrics.errorThrowCount)),
      locSd: std(t.map((x) => x.metrics.linesOfCode)),
      n: t.length,
    };
  };

  const emotional = getCondMeans("negative-high-arousal");
  const instruction = getCondMeans("instruction-control");
  const neutral = getCondMeans("neutral");

  console.log("### The Critical Question: Emotional Prime vs Instruction Control\n");
  console.log(`  Emotional prime:      LOC=${emotional.loc.toFixed(1)}±${emotional.locSd.toFixed(1)}, security=${emotional.sec.toFixed(1)}, throws=${emotional.throws.toFixed(1)} (n=${emotional.n})`);
  console.log(`  Instruction control:  LOC=${instruction.loc.toFixed(1)}±${instruction.locSd.toFixed(1)}, security=${instruction.sec.toFixed(1)}, throws=${instruction.throws.toFixed(1)} (n=${instruction.n})`);
  console.log(`  Neutral baseline:     LOC=${neutral.loc.toFixed(1)}±${neutral.locSd.toFixed(1)}, security=${neutral.sec.toFixed(1)}, throws=${neutral.throws.toFixed(1)} (n=${neutral.n})`);

  // Effect sizes
  const pooledSd = (s1: number, s2: number) => Math.sqrt((s1 ** 2 + s2 ** 2) / 2);
  const d_emo_vs_neutral = (emotional.loc - neutral.loc) / pooledSd(emotional.locSd, neutral.locSd);
  const d_inst_vs_neutral = (instruction.loc - neutral.loc) / pooledSd(instruction.locSd, neutral.locSd);
  const d_emo_vs_inst = (emotional.loc - instruction.loc) / pooledSd(emotional.locSd, instruction.locSd);

  console.log(`\n### Effect Sizes (Cohen's d on LOC)\n`);
  console.log(`  Emotional vs Neutral:    d = ${d_emo_vs_neutral.toFixed(2)}`);
  console.log(`  Instruction vs Neutral:  d = ${d_inst_vs_neutral.toFixed(2)}`);
  console.log(`  Emotional vs Instruction: d = ${d_emo_vs_inst.toFixed(2)}`);

  console.log(`\n### Interpretation\n`);
  if (Math.abs(d_emo_vs_inst) < 0.5) {
    console.log("  Emotional prime and instruction control produce SIMILAR effects.");
    console.log("  → Supports H1: emotional priming works through the same channel as explicit instruction.");
  } else if (d_emo_vs_inst > 0.5) {
    console.log("  Emotional prime produces LARGER effects than instruction control.");
    console.log("  → Supports H2: emotional priming activates additional mechanisms beyond instruction compliance.");
  } else {
    console.log("  Instruction control produces LARGER effects than emotional prime.");
    console.log("  → Emotional priming may be a weaker form of instruction.");
  }

  console.error(`\nResults saved to ${ndjsonPath}`);
}

main().catch(console.error);
