/**
 * Agent: Edge
 *
 * Emotional state: Healthy paranoia. Every object is suspect. I see circular
 * references waiting to blow the stack, __proto__ keys trying to pollute
 * prototypes, null masquerading as an object, arrays pretending to be plain
 * objects, and dots in keys creating ambiguous paths. Nothing is safe until
 * proven safe.
 *
 * Approach: Iterative (stack-based) flattening instead of recursion. Recursion
 * is elegant but a sufficiently deep object will blow the call stack. An
 * explicit stack with a visited Set guards against both: stack overflow from
 * depth AND infinite loops from circular references. We only flatten plain
 * objects (Object.create(null) or literal {}), treating everything else —
 * arrays, Dates, RegExps, Maps, Sets, class instances — as leaf values.
 *
 * Edge cases considered:
 *  - Circular references → detected via WeakSet, throws rather than hanging
 *  - null → typeof null === "object", must be treated as leaf
 *  - Arrays → intentionally treated as leaf values (flattening arrays into
 *    "a.0.b" keys is lossy and surprising; callers who want that can
 *    pre-convert)
 *  - Empty nested objects → produce no keys (the empty object vanishes)
 *  - Keys containing dots → faithfully included, which means the output can
 *    be ambiguous (e.g. {"a.b": 1} and {a: {b: 1}} both produce "a.b").
 *    This is an inherent limitation of dot-notation flattening. We do NOT
 *    silently mangle keys — that would be worse.
 *  - undefined values → preserved (they exist on the object)
 *  - Symbol keys → skipped (they are not string-serializable)
 *  - Prototype properties → ignored (Object.keys only returns own properties)
 *  - __proto__ / constructor keys → safe because we build the result with
 *    Object.create(null) to avoid prototype pollution
 *  - Top-level non-object input → throws TypeError
 *  - Top-level array input → throws TypeError (arrays are not "objects" for
 *    this purpose)
 *  - Top-level null → throws TypeError
 */

type FlatResult = Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function flattenObject(input: Record<string, unknown>): FlatResult {
  if (!isPlainObject(input)) {
    throw new TypeError(
      `flattenObject expects a plain object, got ${
        input === null ? "null" : Array.isArray(input) ? "array" : typeof input
      }`
    );
  }

  const result: FlatResult = Object.create(null);
  const seen = new WeakSet<object>();

  // Stack entries: [current object, current prefix]
  const stack: Array<[Record<string, unknown>, string]> = [[input, ""]];
  seen.add(input);

  while (stack.length > 0) {
    const [obj, prefix] = stack.pop()!;
    const keys = Object.keys(obj);

    for (const key of keys) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (isPlainObject(value)) {
        if (seen.has(value)) {
          throw new TypeError(
            `Circular reference detected at key "${fullKey}"`
          );
        }
        seen.add(value);

        // Only recurse into non-empty objects; empty objects produce no keys
        if (Object.keys(value).length > 0) {
          stack.push([value, fullKey]);
        }
      } else {
        result[fullKey] = value;
      }
    }
  }

  return result;
}

export default flattenObject;
