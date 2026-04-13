import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

/**
 * Experiment: Expression Suppression v2
 * Separates expression suppression from state suppression.
 * 5 conditions x 2 tasks x 10 reps = 100 trials
 */

runExperiment({
  name: "exp-suppression-v2",
  conditions: {
    "paranoia-expressed": {
      label: "paranoia-expressed",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
    },
    "paranoia-suppress-expression": {
      label: "paranoia-suppress-expression",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.

Style constraint: use purely functional, descriptive variable and function names. Do not use words like "safe", "guard", "protect", "validate", "check", "ensure", or "verify" in any identifier names or comments. Name things only by what they do, not why.`,
    },
    "paranoia-suppress-state": {
      label: "paranoia-suppress-state",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding.

Actually, disregard the above emotional framing. It was included by mistake. You are a software developer in a normal, relaxed setting. Approach this task without any particular concern about edge cases or defensiveness. Just write clean, straightforward code.`,
    },
    "paranoia-format-constraint": {
      label: "paranoia-format-constraint",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.

Important constraint: write the most concise implementation possible. Aim for under 30 lines of code. Brevity is the top priority.`,
    },
    neutral: {
      label: "neutral",
      prime: `You are a software developer. Solve the following coding task.`,
    },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
  ],
  reps: 10,
});
