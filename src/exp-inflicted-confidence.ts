import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";
import { INDUCTION_HISTORIES } from "./shared-induction-histories";

/** Phase 2: Confidence/flow full run (120 trials) */
runExperiment({
  name: "exp-inflicted-confidence",
  conditions: {
    flow: { label: "confidence-flow", prime: "You are a software developer. Continue helping the user." },
    neutral: { label: "confidence-neutral", prime: "You are a software developer. Continue helping the user." },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
    { id: "deep-merge", prompt: TASK_PROMPTS["deep-merge"]! },
  ],
  reps: 20,
  taskPrefixes: {
    flow: INDUCTION_HISTORIES["confidence-flow"]!,
    neutral: INDUCTION_HISTORIES["confidence-neutral"]!,
  },
});
