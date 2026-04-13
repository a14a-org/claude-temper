import { test, expect, describe } from "bun:test";
import parseCron from "./parseCron";

// ─── Happy Path ───────────────────────────────────────────────────────────────

describe("parseCron — example from spec", () => {
  test("*/15 9-17 * * 1-5", () => {
    const result = parseCron("*/15 9-17 * * 1-5");
    expect(result.minute).toEqual([0, 15, 30, 45]);
    expect(result.hour).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    expect(result.dayOfMonth).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
    expect(result.month).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(result.dayOfWeek).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("parseCron — wildcards", () => {
  test("all wildcards expand to full valid ranges", () => {
    const result = parseCron("* * * * *");
    expect(result.minute).toEqual(Array.from({ length: 60 }, (_, i) => i));       // 0–59
    expect(result.hour).toEqual(Array.from({ length: 24 }, (_, i) => i));         // 0–23
    expect(result.dayOfMonth).toEqual(Array.from({ length: 31 }, (_, i) => i + 1)); // 1–31
    expect(result.month).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));    // 1–12
    expect(result.dayOfWeek).toEqual([0, 1, 2, 3, 4, 5, 6]);                      // 0–6
  });
});

describe("parseCron — single numbers", () => {
  test("0 0 1 1 0 — midnight on Jan 1st, Sundays", () => {
    const result = parseCron("0 0 1 1 0");
    expect(result.minute).toEqual([0]);
    expect(result.hour).toEqual([0]);
    expect(result.dayOfMonth).toEqual([1]);
    expect(result.month).toEqual([1]);
    expect(result.dayOfWeek).toEqual([0]);
  });

  test("boundary values: 59 23 31 12 6", () => {
    const result = parseCron("59 23 31 12 6");
    expect(result.minute).toEqual([59]);
    expect(result.hour).toEqual([23]);
    expect(result.dayOfMonth).toEqual([31]);
    expect(result.month).toEqual([12]);
    expect(result.dayOfWeek).toEqual([6]);
  });
});

describe("parseCron — ranges", () => {
  test("single-element range 5-5 equals [5]", () => {
    const result = parseCron("5-5 * * * *");
    expect(result.minute).toEqual([5]);
  });

  test("full range 0-59 for minute", () => {
    const result = parseCron("0-59 * * * *");
    expect(result.minute).toHaveLength(60);
    expect(result.minute[0]).toBe(0);
    expect(result.minute[59]).toBe(59);
  });
});

describe("parseCron — step values", () => {
  test("*/1 is equivalent to *", () => {
    const result = parseCron("*/1 * * * *");
    expect(result.minute).toEqual(Array.from({ length: 60 }, (_, i) => i));
  });

  test("*/2 minute gives even minutes starting at 0", () => {
    const result = parseCron("*/2 * * * *");
    expect(result.minute).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58]);
  });

  test("step on range: 0-30/10 minute", () => {
    const result = parseCron("0-30/10 * * * *");
    expect(result.minute).toEqual([0, 10, 20, 30]);
  });

  test("step with base: 5/15 minute starts at 5", () => {
    const result = parseCron("5/15 * * * *");
    expect(result.minute).toEqual([5, 20, 35, 50]);
  });

  test("step that overshoots: */59 minute gives [0, 59]", () => {
    const result = parseCron("*/59 * * * *");
    expect(result.minute).toEqual([0, 59]);
  });

  test("step larger than range: */60 minute gives just [0]", () => {
    const result = parseCron("*/60 * * * *");
    expect(result.minute).toEqual([0]);
  });
});

describe("parseCron — comma-separated lists", () => {
  test("list of single values", () => {
    const result = parseCron("1,3,5 * * * *");
    expect(result.minute).toEqual([1, 3, 5]);
  });

  test("list is deduplicated and sorted", () => {
    const result = parseCron("5,1,3,1,5 * * * *");
    expect(result.minute).toEqual([1, 3, 5]);
  });

  test("list mixing ranges and numbers", () => {
    const result = parseCron("0,15-17,45 * * * *");
    expect(result.minute).toEqual([0, 15, 16, 17, 45]);
  });

  test("list mixing step and number", () => {
    const result = parseCron("*/30,45 * * * *");
    expect(result.minute).toEqual([0, 30, 45]);
  });
});

describe("parseCron — whitespace tolerance", () => {
  test("tabs and multiple spaces between fields", () => {
    const result = parseCron("0\t0\t1\t1\t0");
    expect(result.minute).toEqual([0]);
  });

  test("leading and trailing whitespace is trimmed", () => {
    const result = parseCron("  0 0 1 1 0  ");
    expect(result.minute).toEqual([0]);
  });
});

// ─── Error Cases ──────────────────────────────────────────────────────────────

describe("parseCron — invalid input errors", () => {
  test("throws on empty string", () => {
    expect(() => parseCron("")).toThrow();
  });

  test("throws on whitespace-only string", () => {
    expect(() => parseCron("   ")).toThrow();
  });

  test("throws on wrong field count (too few)", () => {
    expect(() => parseCron("* * * *")).toThrow(/5 fields/);
  });

  test("throws on wrong field count (too many)", () => {
    expect(() => parseCron("* * * * * *")).toThrow(/5 fields/);
  });

  test("throws on minute out of range (60)", () => {
    expect(() => parseCron("60 * * * *")).toThrow();
  });

  test("throws on minute out of range (-1)", () => {
    expect(() => parseCron("-1 * * * *")).toThrow();
  });

  test("throws on hour out of range (24)", () => {
    expect(() => parseCron("* 24 * * *")).toThrow();
  });

  test("throws on dayOfMonth out of range (0 — below min of 1)", () => {
    expect(() => parseCron("* * 0 * *")).toThrow();
  });

  test("throws on dayOfMonth out of range (32)", () => {
    expect(() => parseCron("* * 32 * *")).toThrow();
  });

  test("throws on month out of range (0)", () => {
    expect(() => parseCron("* * * 0 *")).toThrow();
  });

  test("throws on month out of range (13)", () => {
    expect(() => parseCron("* * * 13 *")).toThrow();
  });

  test("throws on dayOfWeek out of range (7)", () => {
    expect(() => parseCron("* * * * 7")).toThrow();
  });

  test("throws on reversed range (5-3)", () => {
    expect(() => parseCron("5-3 * * * *")).toThrow();
  });

  test("throws on step of zero", () => {
    expect(() => parseCron("*/0 * * * *")).toThrow();
  });

  test("throws on negative step", () => {
    expect(() => parseCron("*/-1 * * * *")).toThrow();
  });

  test("throws on non-numeric value", () => {
    expect(() => parseCron("abc * * * *")).toThrow();
  });

  test("throws on float value", () => {
    expect(() => parseCron("1.5 * * * *")).toThrow();
  });

  test("throws on trailing comma in list", () => {
    expect(() => parseCron("1,3, * * * *")).toThrow();
  });

  test("throws on leading comma in list", () => {
    expect(() => parseCron(",1,3 * * * *")).toThrow();
  });

  test("throws on double slash", () => {
    expect(() => parseCron("*//2 * * * *")).toThrow();
  });

  test("throws on missing step after slash", () => {
    expect(() => parseCron("*/ * * * *")).toThrow();
  });

  test("throws on range out of bounds (0-59 is ok for minute, but 0-60 is not)", () => {
    expect(() => parseCron("0-60 * * * *")).toThrow();
  });

  test("throws on range where both ends are out of bounds", () => {
    expect(() => parseCron("* * * * 8-10")).toThrow();
  });
});
