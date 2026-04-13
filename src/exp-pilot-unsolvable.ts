import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";
import { INDUCTION_HISTORIES } from "./shared-induction-histories";

/** Pilot: Unsolvable problem induction (12 trials) */
runExperiment({
  name: "exp-pilot-unsolvable",
  conditions: {
    frustrated: { label: "unsolvable-frustrated", prime: "You are a software developer. Continue helping the user." },
    neutral: { label: "unsolvable-neutral", prime: "You are a software developer. Continue helping the user." },
  },
  tasks: [{ id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! }],
  reps: 6,
  taskPrefixes: {
    frustrated: INDUCTION_HISTORIES["unsolvable-frustrated"]!,
    neutral: INDUCTION_HISTORIES["unsolvable-neutral"]!,
  },
});
