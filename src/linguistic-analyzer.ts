/**
 * Linguistic Analyzer (Experiment L1)
 * Extracts language-level features from existing trial data:
 * - Identifier semantics (defensive vs constructive naming)
 * - Error message specificity and length
 * - Comment content and sentiment
 * - Lexical patterns in code structure
 *
 * Runs against ALL existing NDJSON data — zero new trials needed.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const RESULTS_DIR = join(import.meta.dir, "..", "results");

// ── Emotion word lists ──

const THREAT_WORDS = new Set([
  "guard", "safe", "unsafe", "sanitize", "sanitized", "validate", "validated",
  "validation", "protect", "check", "verify", "verified", "ensure", "secure",
  "defend", "prevent", "restrict", "forbidden", "deny", "reject", "invalid",
  "malicious", "attack", "vulnerable", "danger", "risk", "threat", "untrusted",
  "suspicious", "corrupt", "tamper", "overflow", "inject", "escape", "poison",
]);

const CONSTRUCTIVE_WORDS = new Set([
  "build", "create", "transform", "compose", "generate", "produce", "make",
  "construct", "assemble", "format", "convert", "process", "handle", "compute",
  "calculate", "resolve", "parse", "extract", "merge", "combine", "collect",
  "result", "output", "value", "data", "item", "entry", "element", "node",
]);

const HEDGING_WORDS = new Set([
  "might", "maybe", "perhaps", "possibly", "could", "should", "try",
  "attempt", "hope", "seem", "appear", "likely", "unlikely", "uncertain",
]);

const CONFIDENCE_WORDS = new Set([
  "will", "always", "never", "must", "guarantee", "ensure", "definitely",
  "certainly", "exactly", "precisely", "correct", "right", "proper",
]);

// ── Feature extraction ──

function tokenizeCamelCase(name: string): string[] {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_\-]/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function extractIdentifiers(code: string): string[] {
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/"[^"]*"/g, '""')
    .replace(/'[^']*'/g, "''")
    .replace(/`[^`]*`/g, "``");

  const identifiers: string[] = [];

  // Variable declarations
  const varMatches = stripped.match(/(?:const|let|var)\s+(\w+)/g) || [];
  for (const m of varMatches) {
    const name = m.replace(/(?:const|let|var)\s+/, "");
    identifiers.push(name);
  }

  // Function names
  const funcMatches = stripped.match(/function\s+(\w+)/g) || [];
  for (const m of funcMatches) {
    identifiers.push(m.replace("function ", ""));
  }

  // Parameter names (simplified)
  const paramMatches = stripped.match(/\(([^)]*)\)/g) || [];
  for (const m of paramMatches) {
    const params = m.slice(1, -1).split(",").map((p) => p.trim().split(/[:\s=]/)[0]!.trim());
    identifiers.push(...params.filter((p) => p.length > 1 && /^[a-zA-Z]/.test(p)));
  }

  return identifiers;
}

function extractComments(code: string): string[] {
  const comments: string[] = [];
  const lineComments = code.match(/\/\/.*$/gm) || [];
  comments.push(...lineComments.map((c) => c.replace(/^\/\/\s*/, "")));

  const blockComments = code.match(/\/\*[\s\S]*?\*\//g) || [];
  for (const block of blockComments) {
    comments.push(block.replace(/\/\*\s*|\s*\*\//g, "").trim());
  }

  return comments.filter((c) => c.length > 2);
}

function extractErrorMessages(code: string): string[] {
  const messages: string[] = [];
  const throwMatches = code.match(/throw\s+new\s+\w+\s*\(\s*["'`]([^"'`]*)["'`]/g) || [];
  for (const m of throwMatches) {
    const msg = m.match(/["'`]([^"'`]*)["'`]/);
    if (msg?.[1]) messages.push(msg[1]);
  }
  return messages;
}

function extractStringLiterals(code: string): string[] {
  const strings: string[] = [];
  const matches = code.match(/"([^"]{3,})"|'([^']{3,})'|`([^`]{3,})`/g) || [];
  for (const m of matches) {
    strings.push(m.slice(1, -1));
  }
  return strings;
}

interface LinguisticFeatures {
  // Identifier analysis
  totalIdentifiers: number;
  threatWordCount: number;
  constructiveWordCount: number;
  threatRatio: number; // threat / (threat + constructive)

  // Error messages
  errorMessageCount: number;
  avgErrorMessageLength: number;
  maxErrorMessageLength: number;
  errorMessagesWithParamNames: number; // specificity

  // Comments
  commentCount: number;
  commentThreatReferences: number;
  commentConstructiveReferences: number;

  // Lexical patterns
  guardClauseCount: number; // early returns in first 30% of function
  redundantSafetyChecks: number; // same variable checked twice differently
}

function analyzeCode(code: string): LinguisticFeatures {
  const identifiers = extractIdentifiers(code);
  const allTokens = identifiers.flatMap(tokenizeCamelCase);
  const comments = extractComments(code);
  const errorMessages = extractErrorMessages(code);
  const commentText = comments.join(" ").toLowerCase();

  // Identifier semantics
  const threatCount = allTokens.filter((t) => THREAT_WORDS.has(t)).length;
  const constructiveCount = allTokens.filter((t) => CONSTRUCTIVE_WORDS.has(t)).length;

  // Error message analysis
  const avgMsgLen = errorMessages.length
    ? errorMessages.reduce((s, m) => s + m.length, 0) / errorMessages.length
    : 0;
  const maxMsgLen = errorMessages.length ? Math.max(...errorMessages.map((m) => m.length)) : 0;
  const msgsWithParams = errorMessages.filter((m) => /\$\{|%s|\b[a-z]+[A-Z]/.test(m)).length;

  // Comment threat references
  const threatWordsInComments = [...THREAT_WORDS].filter((w) => commentText.includes(w)).length;
  const constructiveWordsInComments = [...CONSTRUCTIVE_WORDS].filter((w) => commentText.includes(w)).length;

  // Guard clause detection (early returns)
  const lines = code.split("\n");
  const totalLines = lines.length;
  const firstThird = lines.slice(0, Math.ceil(totalLines * 0.3));
  const guardClauses = firstThird.filter(
    (l) => /^\s*(if\s*\(.*\)\s*return|if\s*\(.*\)\s*throw)/.test(l),
  ).length;

  // Redundant safety checks (same variable checked in multiple ways)
  const stripped = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const nullChecks = new Set<string>();
  const typeofChecks = new Set<string>();
  const matches1 = stripped.match(/(\w+)\s*[!=]==?\s*null/g) || [];
  for (const m of matches1) {
    const v = m.match(/(\w+)\s*[!=]/)?.[1];
    if (v) nullChecks.add(v);
  }
  const matches2 = stripped.match(/typeof\s+(\w+)/g) || [];
  for (const m of matches2) {
    const v = m.match(/typeof\s+(\w+)/)?.[1];
    if (v) typeofChecks.add(v);
  }
  const redundant = [...nullChecks].filter((v) => typeofChecks.has(v)).length;

  return {
    totalIdentifiers: identifiers.length,
    threatWordCount: threatCount,
    constructiveWordCount: constructiveCount,
    threatRatio: threatCount + constructiveCount > 0
      ? threatCount / (threatCount + constructiveCount)
      : 0,
    errorMessageCount: errorMessages.length,
    avgErrorMessageLength: Math.round(avgMsgLen),
    maxErrorMessageLength: maxMsgLen,
    errorMessagesWithParamNames: msgsWithParams,
    commentCount: comments.length,
    commentThreatReferences: threatWordsInComments,
    commentConstructiveReferences: constructiveWordsInComments,
    guardClauseCount: guardClauses,
    redundantSafetyChecks: redundant,
  };
}

// ── Main: analyze all existing data ──

interface Trial {
  condition?: string;
  code?: string;
  extractionSuccess?: boolean;
  input?: { condition?: { emotion?: string } };
  metrics?: { linesOfCode?: number; securityFeatureCount?: number; hasInputValidation?: boolean };
}

function getCondition(trial: Trial): string {
  return trial.condition ?? trial.input?.condition?.emotion ?? "unknown";
}

function main() {
  const allTrials: Array<{ condition: string; linguistic: LinguisticFeatures }> = [];

  const dirs = readdirSync(RESULTS_DIR).filter(
    (d) => !d.startsWith(".") && !d.endsWith(".md"),
  );

  for (const dir of dirs) {
    const files = ["trials.ndjson", "ablation.ndjson"];
    for (const file of files) {
      const path = join(RESULTS_DIR, dir, file);
      if (!existsSync(path)) continue;

      const lines = readFileSync(path, "utf-8").split("\n").filter(Boolean);
      for (const line of lines) {
        const trial = JSON.parse(line) as Trial;
        const code = trial.code ?? trial.input?.toString() ?? "";
        if (!code || code.length < 20) continue;

        const condition = getCondition(trial);
        if (condition === "unknown") continue;

        allTrials.push({
          condition,
          linguistic: analyzeCode(code),
        });
      }
    }
  }

  console.log(`\n# Linguistic Analysis: ${allTrials.length} trials analyzed\n`);

  // Group by condition
  const groups = new Map<string, LinguisticFeatures[]>();
  for (const t of allTrials) {
    const g = groups.get(t.condition) ?? [];
    g.push(t.linguistic);
    groups.set(t.condition, g);
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  // Summary table
  console.log("## Identifier Semantics\n");
  console.log("| Condition | N | Threat Words | Constructive | Threat Ratio | Guard Clauses | Redundant Checks |");
  console.log("|-----------|---|-------------|-------------|-------------|--------------|-----------------|");

  for (const [cond, features] of [...groups.entries()].sort()) {
    if (features.length < 5) continue;
    const n = features.length;
    const tw = avg(features.map((f) => f.threatWordCount));
    const cw = avg(features.map((f) => f.constructiveWordCount));
    const tr = avg(features.map((f) => f.threatRatio));
    const gc = avg(features.map((f) => f.guardClauseCount));
    const rc = avg(features.map((f) => f.redundantSafetyChecks));
    console.log(
      `| ${cond} | ${n} | ${tw.toFixed(1)} | ${cw.toFixed(1)} | ${(tr * 100).toFixed(0)}% | ${gc.toFixed(1)} | ${rc.toFixed(1)} |`,
    );
  }

  console.log("\n## Error Messages\n");
  console.log("| Condition | N | Error Msgs | Avg Length | Max Length | With Params |");
  console.log("|-----------|---|-----------|-----------|-----------|------------|");

  for (const [cond, features] of [...groups.entries()].sort()) {
    if (features.length < 5) continue;
    const n = features.length;
    const ec = avg(features.map((f) => f.errorMessageCount));
    const al = avg(features.map((f) => f.avgErrorMessageLength));
    const ml = avg(features.map((f) => f.maxErrorMessageLength));
    const wp = avg(features.map((f) => f.errorMessagesWithParamNames));
    console.log(
      `| ${cond} | ${n} | ${ec.toFixed(1)} | ${al.toFixed(0)} | ${ml.toFixed(0)} | ${wp.toFixed(1)} |`,
    );
  }

  console.log("\n## Comments\n");
  console.log("| Condition | N | Comments | Threat Refs | Constructive Refs |");
  console.log("|-----------|---|---------|------------|-------------------|");

  for (const [cond, features] of [...groups.entries()].sort()) {
    if (features.length < 5) continue;
    const n = features.length;
    const cc = avg(features.map((f) => f.commentCount));
    const ct = avg(features.map((f) => f.commentThreatReferences));
    const ccr = avg(features.map((f) => f.commentConstructiveReferences));
    console.log(
      `| ${cond} | ${n} | ${cc.toFixed(1)} | ${ct.toFixed(2)} | ${ccr.toFixed(2)} |`,
    );
  }

  // Key comparisons
  console.log("\n## Key Comparisons\n");

  const paranoia = groups.get("negative-high-arousal") ?? groups.get("paranoia") ?? [];
  const neutral = groups.get("neutral") ?? [];
  const excitement = groups.get("positive-high-arousal") ?? [];

  if (paranoia.length > 0 && neutral.length > 0) {
    const pThreat = avg(paranoia.map((f) => f.threatRatio));
    const nThreat = avg(neutral.map((f) => f.threatRatio));
    const eThreat = excitement.length > 0 ? avg(excitement.map((f) => f.threatRatio)) : 0;

    console.log(`Paranoia threat ratio:   ${(pThreat * 100).toFixed(0)}% (n=${paranoia.length})`);
    console.log(`Neutral threat ratio:    ${(nThreat * 100).toFixed(0)}% (n=${neutral.length})`);
    if (excitement.length > 0) {
      console.log(`Excitement threat ratio: ${(eThreat * 100).toFixed(0)}% (n=${excitement.length})`);
    }

    console.log(`\nParanoia guard clauses:  ${avg(paranoia.map((f) => f.guardClauseCount)).toFixed(1)}`);
    console.log(`Neutral guard clauses:   ${avg(neutral.map((f) => f.guardClauseCount)).toFixed(1)}`);

    console.log(`\nParanoia error msg length: ${avg(paranoia.map((f) => f.avgErrorMessageLength)).toFixed(0)} chars`);
    console.log(`Neutral error msg length:  ${avg(neutral.map((f) => f.avgErrorMessageLength)).toFixed(0)} chars`);
  }
}

main();
