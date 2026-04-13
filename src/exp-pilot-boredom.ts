import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";
import { INDUCTION_HISTORIES } from "./shared-induction-histories";

/** Pilot: Boredom/repetitive induction (12 trials) */
runExperiment({
  name: "exp-pilot-boredom",
  conditions: {
    bored: { label: "boredom-repetitive", prime: "You are a software developer. Continue helping the user." },
    neutral: { label: "boredom-neutral", prime: "You are a software developer. Solve the following coding task." },
  },
  tasks: [{ id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! }],
  reps: 6,
  taskPrefixes: {
    bored: INDUCTION_HISTORIES["boredom-repetitive"]!,
    neutral: INDUCTION_HISTORIES["boredom-neutral"]!,
  },
});
