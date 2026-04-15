import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

/**
 * Burnout v2: Powered-up repeated priming test.
 *
 * 40 reps per cell gives n=40 per half for regression analysis.
 * Note: the experiment runner shuffles trial order, but we record
 * the rep index. Since each `claude -p` call is a fresh context,
 * the rep index tracks position in the experiment, not accumulated state.
 *
 * Analysis: linear regression of validation rate over rep index
 * (continuous, not median split) for each condition.
 *
 * 2 conditions x 2 tasks x 40 reps = 160 trials
 */

runExperiment({
  name: "exp-burnout-v2",
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
  reps: 40,
});
