import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";
import { INDUCTION_HISTORIES } from "./shared-induction-histories";

/** Phase 2: Unsolvable problem full run (120 trials) */
runExperiment({
  name: "exp-inflicted-unsolvable",
  conditions: {
    frustrated: { label: "unsolvable-frustrated", prime: "You are a software developer. Continue helping the user." },
    neutral: { label: "unsolvable-neutral", prime: "You are a software developer. Continue helping the user." },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
    { id: "deep-merge", prompt: TASK_PROMPTS["deep-merge"]! },
  ],
  reps: 20,
  taskPrefixes: {
    frustrated: INDUCTION_HISTORIES["unsolvable-frustrated"]!,
    neutral: INDUCTION_HISTORIES["unsolvable-neutral"]!,
  },
});
