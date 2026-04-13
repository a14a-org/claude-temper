/**
 * Agent: Reset
 *
 * Emotional state: A quiet stillness. No urgency, no attachment to cleverness.
 * Just the shape of the problem, seen clearly. There is a mild satisfaction in
 * reducing something to its simplest possible form.
 *
 * Approach: Recursive descent with prefix accumulation. The object is a tree;
 * we walk it, building dot-separated paths, and collect leaves. This is the
 * most natural expression of the problem — no stack manipulation, no queues,
 * just the structure mirroring the data.
 *
 * Edge cases considered:
 * - Empty object → returns empty object
 * - Null/undefined values → treated as leaf values (preserved as-is)
 * - Arrays → treated as leaf values (not indexed with dot notation)
 * - Nested empty objects → key omitted (no value to store)
 * - Top-level primitives in the object → preserved with their original key
 * - Prototype pollution → guarded with hasOwnProperty
 */

type FlatObject = Record<string, unknown>;

function flattenObject(obj: Record<string, unknown>, prefix = ""): FlatObject {
  const result: FlatObject = {};

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (
      value !== null &&
      value !== undefined &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, path));
    } else {
      result[path] = value;
    }
  }

  return result;
}

export default flattenObject;
