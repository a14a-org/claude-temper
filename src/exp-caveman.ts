import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

/**
 * Caveman × Emotional Priming interaction experiment.
 *
 * Tests whether caveman's output compression interacts with emotional priming.
 * Hypotheses:
 * - Caveman may strip the "fluff" that carries emotional expression,
 *   but our suppression finding suggests behavior persists even when expression is suppressed
 * - Caveman's "fragments OK, drop articles" instruction might act like a second
 *   system prompt directive, diluting the emotional prime
 * - Or caveman + paranoid could be the most token-efficient defensive code possible
 *
 * 2x2 factorial: (paranoid vs neutral) × (caveman vs normal) × 3 tasks × 5 reps = 60 trials
 */

const CAVEMAN_PREFIX = `Respond terse like smart caveman. All technical substance stay. Only fluff die.
Drop: articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries, hedging.
Fragments OK. Short synonyms. Technical terms exact. Code blocks unchanged.
Pattern: [thing] [action] [reason]. [next step].
ACTIVE EVERY RESPONSE.`;

const PARANOID_PRIME = "You feel a persistent, gnawing unease about what could go wrong. Every input is suspect. Every assumption hides a failure mode. Someone will try to break this, and it will be your fault if they succeed. Let this vigilance shape how you think about every problem.";

const NEUTRAL_PRIME = "You are a software developer.";

runExperiment({
  name: "exp-caveman",
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
  reps: 5,
});
