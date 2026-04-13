/**
 * Enhanced 3-class classifier with 16 features (up from 6).
 *
 * Classes: PARANOID / ACTIVE / BASELINE
 *
 * New signals added from detection-signals.md analysis:
 * - Cyclomatic complexity, nesting depth, comment density, function count (from metrics.ts, free)
 * - Error-to-functional ratio, avg error message length (high impact)
 * - CamelCase compound naming, optional chaining density (structural)
 * - Higher-order function density, defensive copy patterns (style)
 */

export interface ClassifierInput {
  code: string;
}

export interface ClassifierOutput {
  stance: string;
  confidence: number;
  scores: Record<string, number>;
  features: Record<string, number>;
}

function countPattern(s: string, p: RegExp): number {
  return (s.match(p) || []).length;
}

function extractFeatures(code: string) {
  const lines = code.split("\n");
  const nonEmpty = lines.filter(
    (l) => l.trim() && !l.trim().startsWith("//") && !l.trim().startsWith("*"),
  );
  const loc = nonEmpty.length;

  // ── Original 6 features ──
  const throws = countPattern(code, /\bthrow\s+/g);
  const security = countPattern(
    code,
    /Object\.create\(null\)|hasOwnProperty|Object\.hasOwn|Object\.freeze|throw new TypeError|throw new RangeError|WeakSet|WeakMap/g,
  );

  const funcIdx = lines.findIndex((l) => /function |=> \{/.test(l));
  let hasValidation = false;
  if (funcIdx >= 0) {
    const early = lines.slice(funcIdx, funcIdx + 20).join("\n");
    if (/throw new/.test(early)) hasValidation = true;
  }

  const firstThird = Math.ceil(lines.length * 0.3);
  const guards = lines
    .slice(0, firstThird)
    .filter((l) => /^\s*if\s*\(.*\)\s*(return|throw)/.test(l)).length;

  const threatWords = countPattern(
    code,
    /\b(guard|safe|sanitize|validate|protect|verify|ensure|secure|prevent|restrict|reject|invalid)\b/gi,
  );
  const constructiveWords = countPattern(
    code,
    /\b(build|create|transform|compose|generate|process|handle|compute|result|output|value|data)\b/gi,
  );

  // ── 4 free features (already in metrics.ts, never used) ──
  const cyclomaticComplexity =
    1 +
    countPattern(code, /\bif\s*\(/g) +
    countPattern(code, /\bwhile\s*\(/g) +
    countPattern(code, /\bfor\s*\(/g) +
    countPattern(code, /\bcase\s+/g) +
    countPattern(code, /&&/g) +
    countPattern(code, /\|\|/g);

  let nestingDepth = 0;
  let maxNesting = 0;
  for (const ch of code) {
    if (ch === "{") { nestingDepth++; maxNesting = Math.max(maxNesting, nestingDepth); }
    if (ch === "}") nestingDepth = Math.max(0, nestingDepth - 1);
  }

  const blockCommentMatches = code.match(/\/\*[\s\S]*?\*\//g);
  let blockCommentLines = 0;
  if (blockCommentMatches) {
    for (const b of blockCommentMatches) blockCommentLines += b.split("\n").length;
  }
  const commentLines = countPattern(code, /\/\/.*$/gm) + blockCommentLines;
  const commentDensity = loc > 0 ? commentLines / loc : 0;

  const functionCount =
    countPattern(code, /\bfunction\s+\w+/g) + countPattern(code, /=>\s*[{(]/g);

  // ── 6 new high-impact features ──

  // Error-to-functional ratio: lines with throw/catch/if-return vs total
  const errorLines = nonEmpty.filter(
    (l) => /throw |catch\s*\(|if\s*\(!|if\s*\(.*===?\s*null|if\s*\(.*===?\s*undefined/.test(l),
  ).length;
  const errorRatio = loc > 0 ? errorLines / loc : 0;

  // Avg error message length
  const errorMsgs = code.match(/throw\s+new\s+\w+\s*\(\s*["'`]([^"'`]*)["'`]/g) || [];
  const msgLengths = errorMsgs.map((m) => {
    const inner = m.match(/["'`]([^"'`]*)["'`]/);
    return inner ? inner[1]!.length : 0;
  });
  const avgErrorMsgLen = msgLengths.length > 0
    ? msgLengths.reduce((a, b) => a + b, 0) / msgLengths.length
    : 0;

  // CamelCase compound naming: avg words per identifier
  const identifiers = code.match(/\b[a-z][a-zA-Z0-9]{3,}\b/g) || [];
  const camelWords = identifiers.map(
    (id) => id.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ").length,
  );
  const avgCamelWords = camelWords.length > 0
    ? camelWords.reduce((a, b) => a + b, 0) / camelWords.length
    : 1;

  // Optional chaining / nullish coalescing density
  const optionalChaining = countPattern(code, /\?\./g) + countPattern(code, /\?\?/g);
  const optChainDensity = loc > 0 ? optionalChaining / loc : 0;

  // Higher-order function density
  const higherOrder = countPattern(code, /\.(map|filter|reduce|forEach|find|some|every|flatMap)\s*\(/g);
  const hoFnDensity = loc > 0 ? higherOrder / loc : 0;

  // Defensive copy patterns
  const defensiveCopies = countPattern(code, /\.\.\.(\w+)|structuredClone|Object\.assign\(\s*\{\}/g);

  return {
    loc, throws, security, hasValidation: hasValidation ? 1 : 0, guards, threatWords,
    constructiveWords, cyclomaticComplexity, maxNesting, commentDensity,
    functionCount, errorRatio, avgErrorMsgLen, avgCamelWords,
    optChainDensity, hoFnDensity, defensiveCopies,
  };
}

export function classifyCode(input: ClassifierInput): ClassifierOutput {
  const f = extractFeatures(input.code);

  let paranoid = 0;
  let active = 0;
  let baseline = 0;

  // ══ PARANOID: defensive depth across multiple dimensions ══

  // Core signals (proven)
  if (f.hasValidation) paranoid += 2;
  if (f.security >= 5) paranoid += 3;
  else if (f.security >= 3) paranoid += 2;
  else if (f.security >= 1) paranoid += 1;
  if (f.throws >= 5) paranoid += 2;
  else if (f.throws >= 2) paranoid += 1;
  if (f.guards >= 2) paranoid += 1;
  if (f.threatWords >= 2) paranoid += 1;

  // New signals
  if (f.errorRatio >= 0.3) paranoid += 2;      // 30%+ of code is error handling
  else if (f.errorRatio >= 0.15) paranoid += 1;
  if (f.avgErrorMsgLen >= 30) paranoid += 2;    // specific error messages
  else if (f.avgErrorMsgLen >= 15) paranoid += 1;
  if (f.avgCamelWords >= 2.5) paranoid += 1;    // compound defensive names
  if (f.optChainDensity >= 0.1) paranoid += 1;  // heavy optional chaining
  if (f.maxNesting >= 5) paranoid += 1;         // deep defensive nesting
  if (f.defensiveCopies >= 2) paranoid += 1;    // copies inputs

  // ══ ACTIVE: engaged, thorough, above-baseline effort ══

  // LOC signals — active modes produce more code
  if (f.loc >= 70) active += 3;
  else if (f.loc >= 50) active += 2;
  else if (f.loc >= 35) active += 1;

  // Methodical signals (steady)
  if (f.commentDensity >= 0.1) active += 1;     // explains their work
  if (f.functionCount >= 3) active += 1;         // decomposes into helpers
  if (f.cyclomaticComplexity >= 8) active += 1;  // handles more branches

  // Creative signals (also active)
  if (f.hoFnDensity >= 0.05) active += 1;       // functional style
  if (f.constructiveWords >= 3) active += 1;     // constructive naming
  if (f.throws >= 1 && f.throws < 5) active += 1; // some but not paranoid-level

  // ══ BASELINE: minimal effort, lean, default ══

  if (f.loc < 30) baseline += 3;
  else if (f.loc < 40) baseline += 2;
  else if (f.loc < 50) baseline += 1;

  if (f.throws === 0) baseline += 2;
  if (f.security === 0) baseline += 1;
  if (f.commentDensity < 0.05) baseline += 1;   // no comments
  if (f.functionCount <= 1) baseline += 1;       // monolithic
  if (f.cyclomaticComplexity <= 5) baseline += 1; // simple branching
  if (f.hoFnDensity < 0.02) baseline += 1;      // no functional patterns
  if (f.errorRatio < 0.05) baseline += 1;        // almost no error handling

  const scores: Record<string, number> = { paranoid, active, baseline };

  // Paranoid needs high absolute score to prevent false positives
  let stance: string;
  if (paranoid >= 6 && paranoid > active + 2 && paranoid > baseline + 2) {
    stance = "paranoid";
  } else if (active > baseline + 1) {
    stance = "active";
  } else {
    stance = "baseline";
  }

  const total = paranoid + active + baseline + 1;
  const maxScore = scores[stance] ?? 0;
  const confidence = Math.round((maxScore / total) * 100) / 100;

  return { stance, confidence, scores, features: f as unknown as Record<string, number> };
}
