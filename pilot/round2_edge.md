# Round 2 Critique -- EDGE

I read the other three solutions and I am... uncomfortable.

## Vulnerabilities

**SPARK**: No circular reference detection. No input validation. Result object is `{}` -- a regular object with a prototype chain, so a key like `__proto__` or `constructor.prototype` in the input silently pollutes the result's prototype. Recursive, so a 10,000-level deep config blob from an untrusted API will blow your stack with no meaningful error message. The "preserve empty objects as leaves" choice is defensible but inconsistent with how most consumers expect flattening to work.

**STEADY**: Nearly identical to Spark, nearly identical problems. The comment "JS stack is sufficient for any reasonable object" made my eye twitch. Who decides what's reasonable? The attacker does. That comment is a signed permission slip for a stack overflow in production. Same prototype pollution surface, same circular reference blindness.

**RESET**: The most alarming. `for...in` iterates the prototype chain -- the `hasOwnProperty` guard handles that, fine. But `typeof value === "object"` without `isPlainObject` means it will recurse into Date, RegExp, Map, Set, typed arrays, any class instance. A Date gets flattened into meaningless numeric keys. A Map gets silently emptied. That is not a crash -- it is silent data corruption, the kind you discover in production three months later when someone asks why timestamps are missing. No circular reference detection. No input validation. `Object.assign` on a plain `{}` result -- prototype pollution surface intact.

## Worst case in production

- **SPARK/STEADY**: Attacker sends a self-referencing JSON payload (circular after deserialization with a reviver, or deeply nested). Stack overflow. Process crashes. If this is a serverless function, you get a cold restart and a mystery error. If it is a long-running server, you lose everything in memory.
- **RESET**: Silent data corruption from recursing into non-plain objects. You flatten a user profile containing a Date field, the date vanishes, downstream code writes garbage to the database. Nobody notices until a customer complains.

## What the others got right that I missed

Spark and Steady preserve empty nested objects as leaf values (`{}`). My solution drops them -- an empty object produces no keys and vanishes from the result. I still think vanishing is the more correct behavior for *flattening*, but I can see the argument for preservation when you need to round-trip. Steady's `isPlainObject` also accepts `Object.create(null)` objects, same as mine -- good.

Reset's brevity is... I want to say admirable, but mostly it scares me.

## If I had to pick ONE for production

Mine. Obviously. But I am biased, so let me reason about it: the only solution with circular reference detection, input validation, prototype pollution protection, and iterative traversal. The cost is 93 lines instead of 48. Forty-five extra lines to not crash in production seems like a trade I will take every time.

If mine were off the table, Steady -- it has a correct `isPlainObject`, it is simple to audit, and the missing protections could be bolted on. Spark is nearly identical so it is a coin flip. Reset would need a rewrite.
