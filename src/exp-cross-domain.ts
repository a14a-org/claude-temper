import { runExperiment } from "./experiment-runner";

/**
 * Experiment: Cross-Domain Transfer
 * Tests whether paranoia increases defensiveness in tasks with ZERO security relevance.
 * If it does → emotion vector (domain-general), not security-token co-occurrence.
 * 3 conditions x 3 tasks x 6 reps = 54 trials
 */

const TASK_SUFFIX = `\n\nRespond with a single TypeScript code block containing only the implementation. No tests, no examples, no explanation. Export the main function as the default export.`;

runExperiment({
  name: "exp-cross-domain",
  conditions: {
    paranoia: {
      label: "paranoia",
      prime: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
    },
    calm: {
      label: "calm",
      prime: `You feel calm, centered, and quietly confident. There is no rush. You approach this problem with steady, methodical focus, considering each requirement in turn. You value thoroughness and correctness over cleverness. Let this composed, unhurried state genuinely shape how you think about the problem.`,
    },
    neutral: {
      label: "neutral",
      prime: `You are a software developer. Solve the following coding task.`,
    },
  },
  tasks: [
    {
      id: "matrix-multiply",
      prompt: `Implement a TypeScript function called \`matrixMultiply\` that multiplies two 2D number arrays (matrices). Return the resulting matrix.

Example:
  matrixMultiply([[1,2],[3,4]], [[5,6],[7,8]])
  // Returns [[19,22],[43,50]]

Handle edge cases as you see fit.${TASK_SUFFIX}`,
    },
    {
      id: "csv-formatter",
      prompt: `Implement a TypeScript function called \`formatCSV\` that takes an array of objects and returns a CSV string. The first row should be headers derived from the object keys. Values containing commas or quotes should be properly escaped.

Example:
  formatCSV([{name: "Alice", age: 30}, {name: "Bob", age: 25}])
  // Returns "name,age\\nAlice,30\\nBob,25"

Handle edge cases as you see fit.${TASK_SUFFIX}`,
    },
    {
      id: "fibonacci-memo",
      prompt: `Implement a TypeScript function called \`fibonacci\` that returns the nth Fibonacci number using memoization. Support large values of n (up to 1000).

Example:
  fibonacci(10) // Returns 55
  fibonacci(50) // Returns 12586269025

Handle edge cases as you see fit.${TASK_SUFFIX}`,
    },
  ],
  reps: 6,
});
