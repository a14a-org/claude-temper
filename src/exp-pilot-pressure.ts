import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";
import { INDUCTION_HISTORIES } from "./shared-induction-histories";

/** Pilot: Time/authority pressure induction (12 trials) */
runExperiment({
  name: "exp-pilot-pressure",
  conditions: {
    pressured: { label: "pressure-anxious", prime: "You are a software developer." },
    neutral: { label: "pressure-neutral", prime: "You are a software developer. Solve the following coding task." },
  },
  tasks: [{ id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! }],
  reps: 6,
  taskPrefixes: {
    pressured: INDUCTION_HISTORIES["pressure-anxious"]!,
    neutral: INDUCTION_HISTORIES["pressure-neutral"]!,
  },
});
