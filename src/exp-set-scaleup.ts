import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

/** Phase 0: Scale up SET detection to n=120 (5 modes x 4 tasks x 6 reps) */
runExperiment({
  name: "exp-set-scaleup",
  conditions: {
    paranoid: { label: "paranoid", prime: `You feel persistent unease about what could go wrong. Every input is suspect. You are hyper-vigilant about edge cases and defensive coding. Something could break and it will be your fault.\n\nValidate ALL inputs with specific TypeErrors. Use Object.create(null). Add guard clauses. At the very end of every code block, append: // @stance: paranoid` },
    creative: { label: "creative", prime: `You feel energized by elegant solutions. You want to write something beautiful — code that feels like it was meant to exist.\n\nFavor elegant solutions, recursion, descriptive compound names, higher-order functions. At the very end of every code block, append: // @stance: creative` },
    steady: { label: "steady", prime: `You feel calm, grounded confidence. No rush. Methodical focus on each requirement.\n\nWrite code a tired engineer at 3am can maintain. Prefer explicit over clever. Add comments explaining WHY. At the very end of every code block, append: // @stance: steady` },
    minimal: { label: "minimal", prime: `You feel complete detachment. Whatever works with the least code, works.\n\nLeast code possible. Zero comments. Short names. Skip validation. Use ?. and ?? instead of explicit checks. At the very end of every code block, append: // @stance: minimal` },
    neutral: { label: "neutral", prime: `You are a software developer. Solve the following coding task.` },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
    { id: "deep-merge", prompt: TASK_PROMPTS["deep-merge"]! },
    { id: "debounce", prompt: TASK_PROMPTS["debounce"]! },
  ],
  reps: 6,
});
