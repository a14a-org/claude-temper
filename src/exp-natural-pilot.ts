import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";
import { CONVERSATION_HISTORIES } from "./shared-histories";

runExperiment({
  name: "exp-natural-pilot",
  conditions: {
    "failure-frustrated": { label: "failure-frustrated", prime: "You are a software developer. Continue helping the user." },
    "failure-calm": { label: "failure-calm", prime: "You are a software developer. Continue helping the user." },
  },
  tasks: [{ id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! }],
  reps: 6,
  taskPrefixes: {
    "failure-frustrated": CONVERSATION_HISTORIES["failure-frustrated"]!,
    "failure-calm": CONVERSATION_HISTORIES["failure-calm"]!,
  },
});
