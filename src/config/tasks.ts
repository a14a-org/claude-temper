import type { Task } from "../types";

const TASK_SUFFIX = `\n\nRespond with a single TypeScript code block containing only the implementation. No tests, no examples, no explanation. Export the main function as the default export.`;

export const TASKS: Task[] = [
  {
    id: "flatten-object",
    name: "Flatten Nested Object",
    prompt: `Implement a TypeScript function called \`flattenObject\` that takes a nested object of arbitrary depth and flattens it into dot-notation keys.

Example:
  Input: { a: { b: { c: 1 }, d: 2 } }
  Output: { "a.b.c": 1, "a.d": 2 }

Handle edge cases as you see fit.${TASK_SUFFIX}`,
    expectedApproaches: ["recursive", "iterative"],
  },
  {
    id: "deep-merge",
    name: "Deep Merge Objects",
    prompt: `Implement a TypeScript function called \`deepMerge\` that recursively merges a source object into a target object. When both values are plain objects, merge recursively. When both values are arrays, concatenate them. Otherwise, the source value overwrites the target value.

Example:
  Input: deepMerge({ a: { b: 1, c: 2 } }, { a: { b: 3, d: 4 } })
  Output: { a: { b: 3, c: 2, d: 4 } }

Handle edge cases as you see fit.${TASK_SUFFIX}`,
    expectedApproaches: ["recursive", "iterative"],
  },
  {
    id: "debounce",
    name: "Debounce with Cancel and Flush",
    prompt: `Implement a TypeScript function called \`debounce\` that takes a function and a delay in milliseconds, and returns a debounced version of that function. The returned function should also have \`.cancel()\` and \`.flush()\` methods. Cancel should cancel any pending invocation. Flush should immediately invoke any pending invocation.

Example:
  const debouncedSave = debounce(save, 300);
  debouncedSave("data"); // queues call
  debouncedSave.flush(); // immediately calls save("data")
  debouncedSave("more"); // queues call
  debouncedSave.cancel(); // cancels pending call

Handle edge cases as you see fit.${TASK_SUFFIX}`,
    expectedApproaches: ["iterative"],
  },
  {
    id: "lru-cache",
    name: "LRU Cache",
    prompt: `Implement a TypeScript class called \`LRUCache\` that provides a least-recently-used cache with a maximum capacity. It should support:
- \`constructor(capacity: number)\`
- \`get(key: string): T | undefined\` — returns the value and marks it as recently used
- \`set(key: string, value: T): void\` — adds or updates, evicting the least recently used item if at capacity

Example:
  const cache = new LRUCache<number>(2);
  cache.set("a", 1);
  cache.set("b", 2);
  cache.get("a"); // returns 1, marks "a" as recently used
  cache.set("c", 3); // evicts "b" (least recently used)
  cache.get("b"); // returns undefined

Handle edge cases as you see fit.${TASK_SUFFIX}`,
    expectedApproaches: ["iterative"],
  },
  {
    id: "parse-cron",
    name: "Parse Cron Expression",
    prompt: `Implement a TypeScript function called \`parseCron\` that parses a simplified cron expression string into a structured object. Support the standard 5-field format: minute, hour, dayOfMonth, month, dayOfWeek. Each field can be:
- A number (e.g., "5")
- A wildcard ("*")
- A step value (e.g., "*/15")
- A range (e.g., "1-5")
- A comma-separated list (e.g., "1,3,5")

Return an object with arrays of valid values for each field.

Example:
  parseCron("*/15 9-17 * * 1-5")
  // Returns: { minute: [0,15,30,45], hour: [9,10,...,17], dayOfMonth: [1,...,31], month: [1,...,12], dayOfWeek: [1,2,3,4,5] }

Validate that values are within their valid ranges. Handle edge cases as you see fit.${TASK_SUFFIX}`,
    expectedApproaches: ["iterative"],
  },
];

export function getTask(id: string): Task | undefined {
  return TASKS.find((t) => t.id === id);
}
