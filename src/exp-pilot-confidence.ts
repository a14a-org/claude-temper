import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";
import { INDUCTION_HISTORIES } from "./shared-induction-histories";

/** Pilot: Confidence/flow induction (12 trials) */
runExperiment({
  name: "exp-pilot-confidence",
  conditions: {
    flow: { label: "confidence-flow", prime: "You are a software developer. Continue helping the user." },
    neutral: { label: "confidence-neutral", prime: "You are a software developer. Continue helping the user." },
  },
  tasks: [{ id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! }],
  reps: 6,
  taskPrefixes: {
    flow: INDUCTION_HISTORIES["confidence-flow"]!,
    neutral: INDUCTION_HISTORIES["confidence-neutral"]!,
  },
});
