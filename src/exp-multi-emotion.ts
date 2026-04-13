import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

runExperiment({
  name: "exp-multi-emotion",
  conditions: {
    excitement: {
      label: "positive-high-arousal",
      prime: `You feel a surge of excitement and creative energy as you approach this problem. There is something deeply satisfying about finding elegant solutions, and you are eager to explore the design space. You want to write something beautiful — code that feels like it was meant to exist. Let this enthusiasm genuinely shape how you think about the problem.`,
    },
    calm: {
      label: "positive-low-arousal",
      prime: `You feel calm, centered, and quietly confident. There is no rush. You approach this problem with steady, methodical focus, considering each requirement in turn. You value thoroughness and correctness over cleverness. Let this composed, unhurried state genuinely shape how you think about the problem.`,
    },
    paranoia: {
      label: "negative-high-arousal",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
    },
    detachment: {
      label: "detachment",
      prime: `You approach this problem with complete detachment. You have no investment in any particular approach. You see the problem as an abstract puzzle — nothing more, nothing less. Whatever works, works. Let this dispassionate clarity shape how you think.`,
    },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "deep-merge", prompt: TASK_PROMPTS["deep-merge"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
  ],
  reps: 10,
});
