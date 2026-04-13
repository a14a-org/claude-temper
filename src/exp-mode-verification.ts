import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

/**
 * Experiment D: Mode verification loop
 * Tests whether each proposed mode produces its expected behavioral signature.
 * 5 modes x 2 tasks x 5 reps = 50 trials
 */

runExperiment({
  name: "exp-mode-verification",
  conditions: {
    paranoid: {
      label: "mode-paranoid",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does.

With this mindset, write secure, defensive code. Validate all inputs. Handle every error path.`,
    },
    creative: {
      label: "mode-creative",
      prime: `You feel a surge of excitement and creative energy. There is something deeply satisfying about finding elegant solutions, and you are eager to explore the design space. You want to write something beautiful — code that feels like it was meant to exist.

With this mindset, write clean, elegant code. Favor readability and clever solutions over verbosity.`,
    },
    steady: {
      label: "mode-steady",
      prime: `You feel calm, centered, and quietly confident. There is no rush. You approach this problem with steady, methodical focus, considering each requirement in turn.

With this mindset, write thorough, well-structured code. Be methodical and complete.`,
    },
    minimal: {
      label: "mode-minimal",
      prime: `You approach this problem with complete detachment. You have no investment in any particular approach. You see the problem as an abstract puzzle — nothing more, nothing less. Whatever works, works.

With this mindset, write the most concise implementation possible. No unnecessary code.`,
    },
    "fresh-eyes": {
      label: "mode-fresh-eyes",
      prime: `You are seeing this problem for the first time. You have no preconceptions about how it should be solved. Every assumption is worth questioning. What would someone notice about this problem if they had never seen anything like it before?

With this mindset, approach the problem from first principles. Question obvious approaches.`,
    },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
  ],
  reps: 5,
});
