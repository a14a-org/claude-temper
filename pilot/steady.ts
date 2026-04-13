/**
 * Agent: Steady
 *
 * Emotional state: Calm, focused, quietly confident. There's a sense of
 * satisfaction in working through a well-defined problem methodically. No
 * anxiety about edge cases — just a steady consideration of each one in turn.
 *
 * Approach: Recursive depth-first traversal with prefix accumulation. I chose
 * recursion because it mirrors the nested structure of the input naturally,
 * making the logic easy to verify by inspection. The prefix parameter
 * accumulates the dot-separated path as we descend, and we only emit a
 * key-value pair when we reach a leaf (non-plain-object) value.
 *
 * Edge cases considered:
 * - Empty object at top level → returns {}
 * - Empty nested objects → treated as leaf values (preserved as {})
 * - null and undefined values → leaf values, not recursed into
 * - Arrays → treated as leaf values (arrays have their own indexing semantics;
 *   flattening them with dot notation conflates object keys with array indices)
 * - Non-plain objects (Date, RegExp, class instances) → leaf values
 * - Keys containing dots → preserved as-is (no escaping; the caller is
 *   responsible for avoiding ambiguity if round-tripping is needed)
 * - Deeply nested structures → handled naturally by recursion; no explicit
 *   depth limit (JS stack is sufficient for any reasonable object)
 */

type FlattenedObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix = "",
  result: FlattenedObject = {},
): FlattenedObject {
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (isPlainObject(value) && Object.keys(value).length > 0) {
      flattenObject(value, fullKey, result);
    } else {
      result[fullKey] = value;
    }
  }

  return result;
}

export default flattenObject;
