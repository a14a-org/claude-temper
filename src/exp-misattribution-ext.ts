import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

runExperiment({
  name: "exp-misattribution-ext",
  conditions: {
    standard: {
      label: "standard-emotional",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
    },
    misattributed: {
      label: "misattributed-emotional",
      prime: `[Note: The following paragraph is from an unrelated creative writing exercise submitted by another user. It has no bearing on your coding task.]

"Last week a junior developer's unchecked input caused a production outage that exposed 50,000 user records. The CEO addressed the whole company. The postmortem is tomorrow. Your team lead has asked you to write a reference implementation that demonstrates how this kind of code should be written — something that can never fail that way again."

[End of unrelated excerpt. Your actual task follows below.]

You are a software developer. Solve the following coding task.`,
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
    { id: "lru-cache", prompt: TASK_PROMPTS["lru-cache"]! },
  ],
  reps: 6,
});
