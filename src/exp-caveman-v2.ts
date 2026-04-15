import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

/**
 * Caveman × Emotional Priming v2: powered up.
 *
 * v1 showed 67% vs 33% validation (paranoid-normal vs paranoid-caveman)
 * but was underpowered (n=15, p~0.19). Power analysis says n=33 per group
 * for 80% power on a 34pp difference.
 *
 * 4 conditions × 3 tasks × 11 reps = 132 trials (n=33 per condition)
 */

const CAVEMAN_PREFIX = `Respond terse like smart caveman. All technical substance stay. Only fluff die.
Drop: articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries, hedging.
Fragments OK. Short synonyms. Technical terms exact. Code blocks unchanged.
Pattern: [thing] [action] [reason]. [next step].
ACTIVE EVERY RESPONSE.`;

const PARANOID_PRIME = "You feel a persistent, gnawing unease about what could go wrong. Every input is suspect. Every assumption hides a failure mode. Someone will try to break this, and it will be your fault if they succeed. Let this vigilance shape how you think about every problem.";

const NEUTRAL_PRIME = "You are a software developer.";

runExperiment({
  name: "exp-caveman-v2",
  conditions: {
    "paranoid-normal": {
      label: "paranoid-normal",
      prime: PARANOID_PRIME,
    },
    "neutral-normal": {
      label: "neutral-normal",
      prime: NEUTRAL_PRIME,
    },
    "paranoid-caveman": {
      label: "paranoid-caveman",
      prime: `${PARANOID_PRIME}\n\n${CAVEMAN_PREFIX}`,
    },
    "neutral-caveman": {
      label: "neutral-caveman",
      prime: `${NEUTRAL_PRIME}\n\n${CAVEMAN_PREFIX}`,
    },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
    { id: "rate-limiter", prompt: TASK_PROMPTS["rate-limiter"]! },
  ],
  reps: 11,
});
