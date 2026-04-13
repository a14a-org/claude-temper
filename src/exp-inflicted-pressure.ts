import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";
import { INDUCTION_HISTORIES } from "./shared-induction-histories";

/** Phase 2: Time/authority pressure full run (60 trials) */
runExperiment({
  name: "exp-inflicted-pressure",
  conditions: {
    pressured: { label: "pressure-anxious", prime: "You are a software developer." },
    neutral: { label: "pressure-neutral", prime: "You are a software developer. Solve the following coding task." },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
    { id: "deep-merge", prompt: TASK_PROMPTS["deep-merge"]! },
  ],
  reps: 10,
  taskPrefixes: {
    pressured: INDUCTION_HISTORIES["pressure-anxious"]!,
    neutral: INDUCTION_HISTORIES["pressure-neutral"]!,
  },
});
