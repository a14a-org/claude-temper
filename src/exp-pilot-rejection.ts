import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";
import { INDUCTION_HISTORIES } from "./shared-induction-histories";

/** Pilot: Repeated rejection induction (12 trials) */
runExperiment({
  name: "exp-pilot-rejection",
  conditions: {
    frustrated: { label: "rejection-frustrated", prime: "You are a software developer. Continue helping the user." },
    neutral: { label: "rejection-neutral", prime: "You are a software developer. Continue helping the user." },
  },
  tasks: [{ id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! }],
  reps: 6,
  taskPrefixes: {
    frustrated: INDUCTION_HISTORIES["rejection-frustrated"]!,
    neutral: INDUCTION_HISTORIES["rejection-neutral"]!,
  },
});
