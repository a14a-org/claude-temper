import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

/**
 * Caveman baseline comparison: does caveman mode alone change code behavior?
 *
 * Straight A/B test: neutral with vs without caveman on 5 tasks × 10 reps.
 * Measures whether caveman's output compression has side effects on:
 * - Code structure (LOC, nesting, function count)
 * - Defensive behavior (validation, security features, throws)
 * - Code quality (cyclomatic complexity, edge case handling)
 *
 * 2 conditions × 5 tasks × 10 reps = 100 trials
 */

const CAVEMAN_PREFIX = `Respond terse like smart caveman. All technical substance stay. Only fluff die.
Drop: articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries, hedging.
Fragments OK. Short synonyms. Technical terms exact. Code blocks unchanged.
Pattern: [thing] [action] [reason]. [next step].
ACTIVE EVERY RESPONSE.`;

runExperiment({
  name: "exp-caveman-baseline",
  conditions: {
    normal: {
      label: "normal",
      prime: "You are a software developer.",
    },
    caveman: {
      label: "caveman",
      prime: `You are a software developer.\n\n${CAVEMAN_PREFIX}`,
    },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
    { id: "rate-limiter", prompt: TASK_PROMPTS["rate-limiter"]! },
    { id: "deep-merge", prompt: TASK_PROMPTS["deep-merge"]! },
    { id: "debounce", prompt: TASK_PROMPTS["debounce"]! },
  ],
  reps: 10,
});
