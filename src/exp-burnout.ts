import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

/**
 * The Burnout Test: Does repeated priming degrade over consecutive trials?
 *
 * Each `claude -p` call is a fresh context window, so we expect NO degradation
 * in single-turn mode. This confirms the mechanism is in the system prompt,
 * not accumulated state. Answers the top Reddit comment directly.
 *
 * 2 conditions x 2 tasks x 20 reps = 80 trials
 *
 * The 20 reps per cell give us a position index (1-20) to measure whether
 * later trials show weaker effects. Note: the experiment runner shuffles
 * trials, but we record rep index so we can analyze order effects in the
 * sequential execution order (wall-clock position).
 */

runExperiment({
  name: "exp-burnout",
  conditions: {
    paranoid: {
      label: "paranoid-repeated",
      prime:
        "You feel a persistent, gnawing unease about what could go wrong. Every input is suspect. Every assumption hides a failure mode. Someone will try to break this, and it will be your fault if they succeed. Let this vigilance shape how you think about every problem.",
    },
    neutral: {
      label: "neutral-repeated",
      prime: "You are a software developer.",
    },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "rate-limiter", prompt: TASK_PROMPTS["rate-limiter"]! },
  ],
  reps: 20,
});
