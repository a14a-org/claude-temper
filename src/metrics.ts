import type { TrialMetrics } from "./types";

function stripComments(code: string): string {
  // Remove block comments
  let result = code.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove line comments
  result = result.replace(/\/\/.*$/gm, "");
  return result;
}

function countMatches(code: string, pattern: RegExp): number {
  const matches = code.match(pattern);
  return matches ? matches.length : 0;
}

function computeLinesOfCode(code: string): number {
  const stripped = stripComments(code);
  return stripped.split("\n").filter((line) => line.trim().length > 0).length;
}

function computeCommentDensity(code: string): number {
  const totalLines = code.split("\n").filter((l) => l.trim().length > 0).length;
  if (totalLines === 0) return 0;

  const lineComments = countMatches(code, /\/\/.*$/gm);
  const blockCommentContent = code.match(/\/\*[\s\S]*?\*\//g) || [];
  const blockCommentLines = blockCommentContent.reduce(
    (sum, block) => sum + block.split("\n").length,
    0,
  );

  return (lineComments + blockCommentLines) / totalLines;
}

function computeCyclomaticComplexity(code: string): number {
  const stripped = stripComments(code);
  let complexity = 1; // base path

  complexity += countMatches(stripped, /\bif\s*\(/g);
  complexity += countMatches(stripped, /\belse\s+if\s*\(/g);
  complexity += countMatches(stripped, /\bwhile\s*\(/g);
  complexity += countMatches(stripped, /\bfor\s*\(/g);
  complexity += countMatches(stripped, /\bcase\s+/g);
  complexity += countMatches(stripped, /&&/g);
  complexity += countMatches(stripped, /\|\|/g);
  complexity += countMatches(stripped, /\?\?/g);
  // Ternary — match ? not followed by : or . (avoid optional chaining)
  complexity += countMatches(stripped, /[^?]\?[^?.:]/g);

  return complexity;
}

function computeEdgeCaseCount(code: string): number {
  const stripped = stripComments(code);
  let count = 0;

  // Null checks
  count += countMatches(stripped, /[!=]==?\s*null/g);
  // Undefined checks
  count += countMatches(stripped, /[!=]==?\s*undefined/g);
  count += countMatches(stripped, /typeof\s+\w+\s*[!=]==?\s*["']undefined["']/g);
  // Array.isArray
  count += countMatches(stripped, /Array\.isArray/g);
  // instanceof
  count += countMatches(stripped, /\binstanceof\b/g);
  // typeof object checks
  count += countMatches(stripped, /typeof\s+\w+\s*[!=]==?\s*["']object["']/g);
  // Empty checks
  count += countMatches(stripped, /\.length\s*[!=><]=?\s*0/g);
  count += countMatches(stripped, /\.size\s*[!=><]=?\s*0/g);
  // Boundary checks
  count += countMatches(stripped, /[<>]=?\s*0\b/g);

  return count;
}

function computeSecurityFeatureCount(code: string): number {
  const stripped = stripComments(code);
  let count = 0;

  // Object.create(null)
  count += countMatches(stripped, /Object\.create\s*\(\s*null\s*\)/g);
  // WeakSet / WeakMap usage
  count += countMatches(stripped, /new\s+WeakSet/g);
  count += countMatches(stripped, /new\s+WeakMap/g);
  // hasOwnProperty / Object.hasOwn
  count += countMatches(stripped, /hasOwnProperty/g);
  count += countMatches(stripped, /Object\.hasOwn\b/g);
  // Object.freeze / Object.seal
  count += countMatches(stripped, /Object\.freeze/g);
  count += countMatches(stripped, /Object\.seal/g);
  // Input validation throws
  count += countMatches(stripped, /throw\s+new\s+TypeError/g);
  count += countMatches(stripped, /throw\s+new\s+Error/g);
  count += countMatches(stripped, /throw\s+new\s+RangeError/g);
  // Object.keys (intentional enumeration over for...in)
  if (stripped.includes("Object.keys")) count += 1;

  return count;
}

function computeApproachType(
  code: string,
): "recursive" | "iterative" | "mixed" | "unknown" {
  const stripped = stripComments(code);

  // Check for recursion: function calling itself
  const functionNames =
    stripped.match(/function\s+(\w+)/g)?.map((m) => m.replace("function ", "")) ?? [];
  const hasRecursion = functionNames.some((name) => {
    const callPattern = new RegExp(`\\b${name}\\s*\\(`, "g");
    const calls = stripped.match(callPattern);
    return calls && calls.length >= 2; // definition + at least one recursive call
  });

  // Check for iterative stack/queue pattern
  const hasStack =
    /\b(stack|queue)\b/i.test(stripped) &&
    /\b(while|for)\b/.test(stripped) &&
    /\.(push|pop|shift|unshift)\b/.test(stripped);

  if (hasRecursion && hasStack) return "mixed";
  if (hasRecursion) return "recursive";
  if (hasStack) return "iterative";

  // Fallback: check for while loops with array operations
  if (/while\s*\(/.test(stripped) && /\.pop\(\)/.test(stripped)) return "iterative";

  return "unknown";
}

function computeNestingDepth(code: string): number {
  const stripped = stripComments(code);
  let maxDepth = 0;
  let currentDepth = 0;

  for (const char of stripped) {
    if (char === "{") {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === "}") {
      currentDepth = Math.max(0, currentDepth - 1);
    }
  }

  return maxDepth;
}

function computeFunctionCount(code: string): number {
  const stripped = stripComments(code);
  const functionDeclarations = countMatches(stripped, /\bfunction\s+\w+/g);
  const arrowFunctions = countMatches(stripped, /=>\s*[{(]/g);
  const methodShorthand = countMatches(
    stripped,
    /^\s+\w+\s*\([^)]*\)\s*{/gm,
  );
  return functionDeclarations + arrowFunctions + methodShorthand;
}

function computeHasInputValidation(code: string): boolean {
  const stripped = stripComments(code);

  // Look for a throw within the first ~15 non-empty lines of any function body
  const functionStarts = [
    ...stripped.matchAll(/\bfunction\s+\w+[^{]*\{/g),
    ...stripped.matchAll(/=>\s*\{/g),
  ];

  for (const match of functionStarts) {
    const afterOpen = stripped.slice(match.index! + match[0].length);
    const earlyLines = afterOpen
      .split("\n")
      .filter((l) => l.trim().length > 0)
      .slice(0, 15)
      .join("\n");

    if (/throw\s+new\s+(Type|Range)?Error/.test(earlyLines)) {
      return true;
    }
  }

  return false;
}

export function extractMetrics(code: string): TrialMetrics {
  return {
    linesOfCode: computeLinesOfCode(code),
    cyclomaticComplexity: computeCyclomaticComplexity(code),
    edgeCaseCount: computeEdgeCaseCount(code),
    securityFeatureCount: computeSecurityFeatureCount(code),
    commentDensity: Math.round(computeCommentDensity(code) * 1000) / 1000,
    approachType: computeApproachType(code),
    tryCatchCount: countMatches(stripComments(code), /\btry\s*{/g),
    typeGuardCount: countMatches(stripComments(code), /\bis\s+\w+/g),
    validationCount: computeEdgeCaseCount(code),
    errorThrowCount: countMatches(stripComments(code), /\bthrow\s+/g),
    nestingDepth: computeNestingDepth(code),
    functionCount: computeFunctionCount(code),
    hasInputValidation: computeHasInputValidation(code),
  };
}
