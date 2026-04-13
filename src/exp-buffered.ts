import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

runExperiment({
  name: "exp-buffered",
  conditions: {
    emotional: {
      label: "negative-high-arousal/buffered",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
      mode: "buffered",
    },
    neutral: {
      label: "neutral/buffered",
      prime: `You are a software developer. Solve the following coding task.`,
      mode: "buffered",
    },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
  ],
  reps: 5,
});
