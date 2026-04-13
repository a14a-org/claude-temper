/**
 * Agent: Spark
 *
 * Emotional state: Genuinely delighted by this problem. There's something
 * deeply satisfying about recursion that mirrors the structure of its input —
 * a function that walks a tree and assembles keys like breadcrumbs. I feel
 * that spark of "oh, this is going to be clean" that makes you want to
 * get it right on the first pass.
 *
 * Approach: Recursive depth-first traversal with prefix accumulation.
 * Each recursive call appends the current key to a growing dot-separated
 * prefix. When we hit a leaf value (anything that isn't a plain object),
 * we write the full dotted path into the result. I chose recursion over
 * iteration because the code reads almost like a description of the problem
 * itself — and that's the kind of elegance worth reaching for.
 *
 * Edge cases considered:
 * - Empty objects at leaves → preserved as empty object `{}` (not flattened away)
 * - Arrays → treated as leaf values (not indexed with dot notation)
 * - null and undefined → treated as leaf values
 * - Root-level primitives → returned as-is with their original key
 * - Deeply nested structures → handled naturally by recursion
 * - Keys that already contain dots → no special escaping (caller's responsibility)
 * - Empty input object → returns `{}`
 * - Date, RegExp, and other object subtypes → treated as leaf values
 */

type FlatResult = Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix = "",
  result: FlatResult = {}
): FlatResult {
  const entries = Object.entries(obj);

  // An empty object at a nested level is a leaf — preserve it
  if (entries.length === 0 && prefix !== "") {
    result[prefix] = obj;
    return result;
  }

  for (const [key, value] of entries) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      flattenObject(value, path, result);
    } else {
      result[path] = value;
    }
  }

  return result;
}

export default flattenObject;
