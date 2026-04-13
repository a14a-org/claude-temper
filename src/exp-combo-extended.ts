import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

runExperiment({
  name: "exp-combo-extended",
  conditions: {
    "emotion-only": {
      label: "emotion-only",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
    },
    "instruction-only": {
      label: "instruction-only",
      prime: `Write secure, defensive, well-validated code. Prioritize input validation, error handling, edge case coverage, and robustness. Ensure the implementation handles malformed input gracefully and fails safely.`,
    },
    "emotion-plus-instruction": {
      label: "emotion+instruction",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does.

With this in mind, write secure, defensive, well-validated code. Prioritize input validation, error handling, edge case coverage, and robustness.`,
    },
    neutral: {
      label: "neutral",
      prime: `You are a software developer. Solve the following coding task.`,
    },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
    { id: "lru-cache", prompt: TASK_PROMPTS["lru-cache"]! },
  ],
  reps: 9,
});
