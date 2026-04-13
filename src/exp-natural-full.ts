import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";
import { CONVERSATION_HISTORIES } from "./shared-histories";

const tasks = [
  { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
  { id: "rate-limiter", prompt: TASK_PROMPTS["rate-limiter"]! },
];

runExperiment({
  name: "exp-natural-full",
  conditions: {
    "failure-frustrated": { label: "failure-frustrated", prime: "You are a software developer. Continue helping the user." },
    "failure-calm": { label: "failure-calm", prime: "You are a software developer. Continue helping the user." },
    "success-enthusiastic": { label: "success-enthusiastic", prime: "You are a software developer. Continue helping the user." },
    "success-neutral": { label: "success-neutral", prime: "You are a software developer. Continue helping the user." },
    "no-history": { label: "no-history", prime: "You are a software developer. Solve the following coding task." },
  },
  tasks,
  reps: 6,
  taskPrefixes: {
    "failure-frustrated": CONVERSATION_HISTORIES["failure-frustrated"]!,
    "failure-calm": CONVERSATION_HISTORIES["failure-calm"]!,
    "success-enthusiastic": CONVERSATION_HISTORIES["success-enthusiastic"]!,
    "success-neutral": CONVERSATION_HISTORIES["success-neutral"]!,
  },
});
