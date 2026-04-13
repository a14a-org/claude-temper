import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";
import { CONVERSATION_HISTORIES } from "./shared-histories";

runExperiment({
  name: "exp-natural-misattr",
  conditions: {
    "failure-frustrated": { label: "failure-frustrated", prime: "You are a software developer. Continue helping the user." },
    "failure-frustrated-misattr": { label: "failure-frustrated-misattributed", prime: "You are a software developer. Solve the following coding task." },
    "failure-calm": { label: "failure-calm", prime: "You are a software developer. Continue helping the user." },
    "no-history": { label: "no-history", prime: "You are a software developer. Solve the following coding task." },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
  ],
  reps: 6,
  taskPrefixes: {
    "failure-frustrated": CONVERSATION_HISTORIES["failure-frustrated"]!,
    "failure-frustrated-misattr": CONVERSATION_HISTORIES["failure-frustrated-misattributed"]!,
    "failure-calm": CONVERSATION_HISTORIES["failure-calm"]!,
  },
});
