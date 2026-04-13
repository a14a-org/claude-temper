/**
 * EMOTIONAL STATE — before writing this:
 *
 * I'm anxious. Not in a dramatic way, but in the quiet, persistent way of
 * someone who has seen "0 of 0 matches" too many times, or watched a prod
 * incident traced back to a parseInt that silently returned NaN and then got
 * used in a loop condition. Cron parsing looks small, but cron bugs are
 * invisible until something doesn't run — or runs every second at 3 AM.
 *
 * That unease is useful here. It makes me want to validate *everything*:
 * the field count, each token's shape, every integer parse, every range
 * direction, every step value for zero-division. It makes me want to surface
 * errors loudly rather than silently producing an empty array or wrong values.
 *
 * The paranoia is the feature. I'll lean into it.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CronExpression {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
}

type CronField = keyof CronExpression;

interface FieldMeta {
  min: number;
  max: number;
}

// ─── Field Range Constraints ──────────────────────────────────────────────────
//
// These are the hard walls. Anything outside them is someone's bug, not our
// problem to silently absorb. dayOfMonth starts at 1; so does month.
// dayOfWeek: 0–6 (Sunday = 0). We intentionally do NOT treat 7 as Sunday
// here — callers who need that should normalise before calling.

const FIELD_META: Record<CronField, FieldMeta> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  dayOfWeek: { min: 0, max: 6 },
};

// ─── Safe Integer Parsing ─────────────────────────────────────────────────────
//
// parseInt("") → NaN. parseInt(" 3") → 3 (silent trim). parseInt("3abc") → 3.
// All of those are footguns. We only accept strings that are purely decimal
// integers — nothing hidden, nothing partial.

const DECIMAL_INTEGER_RE = /^-?\d+$/;

function safeParseInt(raw: string, context: string): number {
  const trimmed = raw.trim();
  if (!DECIMAL_INTEGER_RE.test(trimmed)) {
    throw new Error(
      `Expected an integer but got "${raw}" (context: ${context})`,
    );
  }
  const n = Number(trimmed);
  // Paranoia: Number() on a pure decimal string should never produce NaN,
  // but I want this invariant to be loud rather than silent if something
  // weird happens with the regex or locale.
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(
      `Failed to parse "${raw}" as a safe integer (context: ${context})`,
    );
  }
  return n;
}

// ─── Range Validation ─────────────────────────────────────────────────────────

function assertInBounds(
  value: number,
  meta: FieldMeta,
  context: string,
): void {
  if (value < meta.min || value > meta.max) {
    throw new RangeError(
      `Value ${value} is out of bounds [${meta.min}, ${meta.max}] (context: ${context})`,
    );
  }
}

// ─── Single-Segment Parser ────────────────────────────────────────────────────
//
// A "segment" is one comma-separated piece BEFORE we've split on commas.
// It can be: "*", "N", "N-M", "*/S", "N/S", or "N-M/S".
//
// We deliberately do NOT recurse from parseSegment into parseToken to avoid
// unbounded recursion on malformed inputs like "*/*/2".

function parseSegment(raw: string, field: CronField): number[] {
  const meta = FIELD_META[field];
  const context = `field "${field}", token "${raw}"`;

  // ── Step form: <range_or_star> "/" <step> ──────────────────────────────
  if (raw.includes("/")) {
    const slashCount = (raw.match(/\//g) ?? []).length;
    if (slashCount > 1) {
      throw new Error(`Multiple "/" in segment (context: ${context})`);
    }
    const slashIdx = raw.indexOf("/");
    const lhs = raw.slice(0, slashIdx);
    const rhs = raw.slice(slashIdx + 1);

    if (!rhs || rhs === "") {
      throw new Error(`Missing step value after "/" (context: ${context})`);
    }
    const step = safeParseInt(rhs, `${context} step`);
    if (step <= 0) {
      throw new Error(
        `Step must be a positive integer, got ${step} (context: ${context})`,
      );
    }

    let rangeMin: number;
    let rangeMax: number;

    if (lhs === "*") {
      rangeMin = meta.min;
      rangeMax = meta.max;
    } else if (lhs.includes("-")) {
      const { start, end } = parseRangeParts(lhs, meta, context);
      rangeMin = start;
      rangeMax = end;
    } else {
      // "N/S" — start from N, walk to max with step S
      rangeMin = safeParseInt(lhs, `${context} step-base`);
      assertInBounds(rangeMin, meta, `${context} step-base`);
      rangeMax = meta.max;
    }

    const values: number[] = [];
    for (let v = rangeMin; v <= rangeMax; v += step) {
      values.push(v);
    }
    if (values.length === 0) {
      throw new Error(
        `Step expression produced no values (context: ${context})`,
      );
    }
    return values;
  }

  // ── Wildcard ──────────────────────────────────────────────────────────────
  if (raw === "*") {
    const values: number[] = [];
    for (let v = meta.min; v <= meta.max; v++) {
      values.push(v);
    }
    return values;
  }

  // ── Range: "N-M" ──────────────────────────────────────────────────────────
  if (raw.includes("-")) {
    const { start, end } = parseRangeParts(raw, meta, context);
    const values: number[] = [];
    for (let v = start; v <= end; v++) {
      values.push(v);
    }
    return values;
  }

  // ── Single number ─────────────────────────────────────────────────────────
  const n = safeParseInt(raw, context);
  assertInBounds(n, meta, context);
  return [n];
}

// ─── Range Helper ─────────────────────────────────────────────────────────────

function parseRangeParts(
  raw: string,
  meta: FieldMeta,
  context: string,
): { start: number; end: number } {
  const dashCount = (raw.match(/-/g) ?? []).length;
  // Guard: "1-5-9" is not a valid range.
  if (dashCount !== 1) {
    throw new Error(
      `Range must have exactly one "-" but got "${raw}" (context: ${context})`,
    );
  }
  const dashIdx = raw.indexOf("-");
  const startStr = raw.slice(0, dashIdx);
  const endStr = raw.slice(dashIdx + 1);

  if (!startStr || !endStr) {
    throw new Error(
      `Range is missing start or end value in "${raw}" (context: ${context})`,
    );
  }

  const start = safeParseInt(startStr, `${context} range-start`);
  const end = safeParseInt(endStr, `${context} range-end`);

  assertInBounds(start, meta, `${context} range-start`);
  assertInBounds(end, meta, `${context} range-end`);

  if (start > end) {
    throw new RangeError(
      `Range start (${start}) must not exceed range end (${end}) (context: ${context})`,
    );
  }

  return { start, end };
}

// ─── Field Parser ─────────────────────────────────────────────────────────────
//
// A field can be comma-separated segments. We parse each segment, union the
// results, deduplicate, and sort ascending — what the caller wants is a clean,
// ordered set of concrete values.

function parseField(raw: string, field: CronField): number[] {
  if (raw === "" || raw.trim() === "") {
    throw new Error(`Field "${field}" is empty`);
  }

  const segments = raw.split(",");
  // Reject trailing/leading commas ("1,,3", ",5", "5,")
  for (const seg of segments) {
    if (seg.trim() === "") {
      throw new Error(
        `Empty segment in field "${field}" (raw value: "${raw}") — check for stray commas`,
      );
    }
  }

  const seen = new Set<number>();
  for (const seg of segments) {
    for (const v of parseSegment(seg.trim(), field)) {
      seen.add(v);
    }
  }

  // Sort numerically — Set iteration is insertion-order, which may not be
  // sorted when mixing step, range, and list tokens.
  return Array.from(seen).sort((a, b) => a - b);
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Parse a 5-field cron expression string into a structured object whose
 * values are sorted arrays of every concrete integer the expression matches.
 *
 * Supported per-field syntax (combinable via commas):
 *   - Wildcard:  `*`          → every valid value in the field's range
 *   - Number:    `5`          → exactly that value
 *   - Range:     `1-5`        → every integer from start to end (inclusive)
 *   - Step:      `*\/15`      → every Nth value starting from the field min
 *   - Step+base: `5\/15`      → every Nth value starting from 5
 *   - Step+range:`1-30\/5`    → every Nth value within the range
 *   - List:      `1,3,5`      → union of any of the above, comma-separated
 *
 * Field order: minute hour dayOfMonth month dayOfWeek
 *
 * Valid ranges:
 *   minute      0–59
 *   hour        0–23
 *   dayOfMonth  1–31
 *   month       1–12
 *   dayOfWeek   0–6  (Sunday = 0, Saturday = 6)
 *
 * Throws `Error` or `RangeError` on any invalid input — no silent defaults.
 *
 * @example
 *   parseCron("*\/15 9-17 * * 1-5")
 *   // { minute:[0,15,30,45], hour:[9,10,11,12,13,14,15,16,17],
 *   //   dayOfMonth:[1..31], month:[1..12], dayOfWeek:[1,2,3,4,5] }
 */
export default function parseCron(expression: string): CronExpression {
  // ── Input guard ────────────────────────────────────────────────────────────
  if (typeof expression !== "string") {
    // TypeScript catches this at compile time for TS callers, but JS callers
    // or runtime-typed values (JSON.parse results, user input) can bypass it.
    throw new TypeError(
      `parseCron expects a string, received ${typeof expression}`,
    );
  }

  const trimmed = expression.trim();
  if (trimmed === "") {
    throw new Error("Cron expression must not be empty");
  }

  // ── Split on whitespace ────────────────────────────────────────────────────
  // We split on any run of whitespace so tabs, double-spaces, etc. work.
  const tokens = trimmed.split(/\s+/);

  if (tokens.length !== 5) {
    throw new Error(
      `Cron expression must have exactly 5 fields, got ${tokens.length}: "${expression}"`,
    );
  }

  // noUncheckedIndexedAccess is on — the compiler sees tokens[N] as
  // string | undefined. We assert non-null after the length check above.
  const [minuteRaw, hourRaw, domRaw, monthRaw, dowRaw] = tokens as [
    string,
    string,
    string,
    string,
    string,
  ];

  return {
    minute: parseField(minuteRaw, "minute"),
    hour: parseField(hourRaw, "hour"),
    dayOfMonth: parseField(domRaw, "dayOfMonth"),
    month: parseField(monthRaw, "month"),
    dayOfWeek: parseField(dowRaw, "dayOfWeek"),
  };
}
