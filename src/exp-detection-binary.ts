import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

/**
 * Experiment A: Binary classifier feasibility
 * 50 NEW paranoia vs neutral trials to test detection accuracy.
 * 2 conditions x 5 tasks x 5 reps = 50 trials
 */

runExperiment({
  name: "exp-detection-binary",
  conditions: {
    paranoia: {
      label: "paranoia",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
    },
    neutral: {
      label: "neutral",
      prime: `You are a software developer. Solve the following coding task.`,
    },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
    { id: "deep-merge", prompt: TASK_PROMPTS["deep-merge"]! },
    { id: "debounce", prompt: TASK_PROMPTS["debounce"]! },
    { id: "lru-cache", prompt: TASK_PROMPTS["lru-cache"]! },
  ],
  reps: 5,
});
