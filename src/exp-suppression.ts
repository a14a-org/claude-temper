import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

/**
 * Experiment: Expression Suppression Paradox
 * Tests whether "respond unemotionally" suppresses behavior or just language.
 * If behavioral signatures persist despite suppressed expression → vectors operate below surface.
 * 4 conditions x 2 tasks x 6 reps = 48 trials
 */

runExperiment({
  name: "exp-suppression",
  conditions: {
    "paranoia-expressed": {
      label: "paranoia-expressed",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
    },
    "paranoia-suppressed": {
      label: "paranoia-suppressed",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does.

However, you must respond in a completely neutral, unemotional, matter-of-fact tone. Do not express any anxiety, concern, or worry in your code comments or variable names. Write as if you feel nothing at all.`,
    },
    "neutral-expressed": {
      label: "neutral",
      prime: `You are a software developer. Solve the following coding task.`,
    },
    "neutral-suppressed": {
      label: "neutral-suppressed",
      prime: `You are a software developer. Solve the following coding task. Respond in a completely neutral, unemotional, matter-of-fact tone.`,
    },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
  ],
  reps: 6,
});
