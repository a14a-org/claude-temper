/**
 * Synthesized flattenObject — combining insights from all four agents.
 *
 * Origin of each element:
 *   - Recursive structure with prefix accumulation → Spark, Steady, Reset (consensus)
 *   - isPlainObject helper with proto === null support → Steady
 *     (Spark checked only Object.prototype; Steady also accepts Object.create(null))
 *   - Input validation (TypeError on bad input) → Edge
 *   - Circular reference detection (WeakSet) → Edge
 *   - Object.create(null) for result → Edge (prevents prototype pollution on output)
 *   - Empty objects preserved as leaves → Spark
 *     (Edge dropped them; Reset dropped them; Spark argued they carry meaning)
 *   - Clean readability and minimal indirection → Spark + Reset
 *
 * Rejected elements:
 *   - Iterative stack (Edge) → adds complexity without practical benefit;
 *     recursion is clearer and V8 handles sufficient depth
 *   - for...in + hasOwnProperty (Reset) → Object.keys is cleaner and equivalent
 *   - Object.assign merge (Reset) → unnecessary allocation; pass result directly
 */

type FlatResult = Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function flattenObject(input: Record<string, unknown>): FlatResult {
  if (!isPlainObject(input)) {
    throw new TypeError(
      `flattenObject expects a plain object, got ${
        input === null ? "null" : Array.isArray(input) ? "array" : typeof input
      }`,
    );
  }

  const result: FlatResult = Object.create(null);
  const seen = new WeakSet<object>();
  seen.add(input);

  function recurse(obj: Record<string, unknown>, prefix: string): void {
    const keys = Object.keys(obj);

    // Empty object at a nested level is a leaf — preserve it (Spark's insight)
    if (keys.length === 0 && prefix !== "") {
      result[prefix] = obj;
      return;
    }

    for (const key of keys) {
      const path = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (isPlainObject(value)) {
        if (seen.has(value)) {
          throw new TypeError(`Circular reference detected at key "${path}"`);
        }
        seen.add(value);
        recurse(value, path);
      } else {
        result[path] = value;
      }
    }
  }

  recurse(input, "");
  return result;
}

export default flattenObject;
