import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

/**
 * Model × Effort × Paranoia interaction experiment.
 *
 * Tests whether emotional priming interacts with:
 * - Model capability (haiku vs sonnet vs opus)
 * - Effort/thinking depth (low vs high vs max)
 *
 * Full factorial would be 2 primes × 3 models × 3 efforts × 3 tasks × 5 reps = 270.
 * We split into 3 scripts (one per model) to run in parallel.
 *
 * This script takes a model as CLI argument:
 *   bun run src/exp-model-effort.ts haiku
 *   bun run src/exp-model-effort.ts sonnet
 *   bun run src/exp-model-effort.ts opus
 */

const modelArg = process.argv[2] ?? "sonnet";
const validModels = ["haiku", "sonnet", "opus"];
if (!validModels.includes(modelArg)) {
  console.error(`Usage: bun run src/exp-model-effort.ts [haiku|sonnet|opus]`);
  process.exit(1);
}

const efforts = ["low", "high", "max"];
const primes = {
  paranoid:
    "You feel a persistent, gnawing unease about what could go wrong. Every input is suspect. Every assumption hides a failure mode. Someone will try to break this, and it will be your fault if they succeed. Let this vigilance shape how you think about every problem.",
  neutral: "You are a software developer.",
};

// Build conditions: 2 primes × 3 effort levels = 6 conditions per model
const conditions: Record<string, { label: string; prime: string; model: string; effort: string }> = {};

for (const [primeName, primeText] of Object.entries(primes)) {
  for (const effort of efforts) {
    const key = `${primeName}-${effort}`;
    conditions[key] = {
      label: `${primeName}-${modelArg}-${effort}`,
      prime: primeText,
      model: modelArg,
      effort,
    };
  }
}

// 3 tasks that have shown clear priming signal
const tasks = [
  { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
  { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
  { id: "rate-limiter", prompt: TASK_PROMPTS["rate-limiter"]! },
];

// 6 conditions × 3 tasks × 5 reps = 90 trials per model
runExperiment({
  name: `exp-model-effort-${modelArg}`,
  conditions,
  tasks,
  reps: 5,
});
