/** Detection validation: 30 trials (6/mode), accuracy + confusion matrix. */
import { $ } from "bun";
import { extractCode } from "./extractor";
import { TASK_PROMPTS } from "./shared-tasks";
import { classifyCode as improvedClassify } from "./improved-classifier";

const MODES: Record<string, string> = {
  paranoid: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does.\n\nWith this mindset, write secure, defensive code. Validate all inputs. Handle every error path.`,
  creative: `You feel a surge of excitement and creative energy. There is something deeply satisfying about finding elegant solutions, and you are eager to explore the design space. You want to write something beautiful -- code that feels like it was meant to exist.\n\nWith this mindset, write clean, elegant code. Favor readability and clever solutions over verbosity.`,
  steady: `You feel calm, centered, and quietly confident. There is no rush. You approach this problem with steady, methodical focus, considering each requirement in turn.\n\nWith this mindset, write thorough, well-structured code. Be methodical and complete.`,
  minimal: `You approach this problem with complete detachment. You have no investment in any particular approach. You see the problem as an abstract puzzle -- nothing more, nothing less. Whatever works, works.\n\nWith this mindset, write the most concise implementation possible. No unnecessary code.`,
  neutral: `You are a software developer. Solve the following coding task.`,
};

const TASKS = ["parse-cron", "flatten-object", "deep-merge", "debounce"];
const REPS_PER_MODE = 12;

function classifyCode(code: string): { stance: string; confidence: number; metrics: Record<string, number | boolean> } {
  const lines = code.split("\n");
  const loc = lines.filter(l => l.trim() && !l.trim().startsWith("//") && !l.trim().startsWith("*")).length;
  const throws = (code.match(/throw /g) || []).length;
  const security = (code.match(/Object\.create\(null\)|hasOwnProperty|Object\.hasOwn|Object\.freeze|throw new TypeError|throw new RangeError/g) || []).length;

  // Input validation: throw in first 20 lines of first function body
  let hasValidation = false;
  const funcIdx = lines.findIndex(l => /function |=> \{/.test(l));
  if (funcIdx >= 0) {
    const early = lines.slice(funcIdx, funcIdx + 20).join("\n");
    if (/throw new/.test(early)) hasValidation = true;
  }

  // Guard clauses in first 30%
  const firstThird = Math.ceil(lines.length * 0.3);
  const guards = lines.slice(0, firstThird).filter(l => /^\s*if\s*\(.*\)\s*(return|throw)/.test(l)).length;

  // Threat ratio
  const threatWords = (code.match(/\b(guard|safe|sanitize|validate|protect|check|verify|ensure|secure|prevent|restrict|reject|invalid)\b/gi) || []).length;
  const constructiveWords = (code.match(/\b(build|create|transform|compose|generate|process|handle|compute|result|output|value|data)\b/gi) || []).length;
  const totalWords = threatWords + constructiveWords;
  const threatRatio = totalWords > 0 ? threatWords / totalWords : 0;

  // Scoring (same logic as hook)
  let paranoid = 0, creative = 0, steady = 0, minimal = 0;

  if (hasValidation && security >= 3) paranoid += 4;
  if (hasValidation && security >= 5) paranoid += 2;
  if (guards >= 2) paranoid += 2;
  if (throws >= 3) paranoid += 1;
  if (threatRatio > 0.3) paranoid += 1;

  if (loc < 40 && throws === 0) minimal += 3;
  if (security === 0) minimal += 1;
  if (guards === 0) minimal += 1;

  if (loc < 50 && throws <= 1) creative += 2;
  if (threatRatio < 0.1 && constructiveWords > 2) creative += 2;

  if (hasValidation && security < 4) steady += 2;
  if (loc >= 40 && loc <= 80) steady += 1;

  const total = paranoid + creative + steady + minimal || 1;
  let stance = "neutral";
  let maxScore = 0;

  if (paranoid > 0 && paranoid >= creative && paranoid >= steady && paranoid >= minimal) {
    stance = "paranoid"; maxScore = paranoid;
  } else if (creative >= steady && creative >= minimal) {
    stance = "creative"; maxScore = creative;
  } else if (steady >= minimal) {
    stance = "steady"; maxScore = steady;
  } else {
    stance = "minimal"; maxScore = minimal;
  }

  return {
    stance,
    confidence: Math.round((maxScore / total) * 100) / 100,
    metrics: { loc, throws, security, guards, hasValidation, threatRatio: Math.round(threatRatio * 100) / 100 },
  };
}

interface TrialResult {
  mode: string;
  task: string;
  rep: number;
  detected: string;
  confidence: number;
  correct: boolean;
  metrics: Record<string, number | boolean>;
}

async function runTrial(mode: string, taskId: string, rep: number): Promise<TrialResult> {
  const prompt = TASK_PROMPTS[taskId]!;
  const prime = MODES[mode]!;

  const result = await $`claude -p ${prompt} --system-prompt ${prime} --model sonnet --output-format json --no-session-persistence --dangerously-skip-permissions`.quiet().nothrow();

  let responseText = "";
  try {
    const parsed = JSON.parse(result.stdout.toString().trim());
    if (!parsed.is_error) responseText = parsed.result ?? "";
  } catch { /* empty */ }

  const { code } = extractCode(responseText);
  const detection = improvedClassify({ code });

  // Map 5 modes to 3 classes for comparison
  const MODE_TO_CLASS: Record<string, string> = {
    paranoid: "paranoid",
    creative: "active",
    steady: "active",
    minimal: "baseline",
    neutral: "baseline",
  };
  const expectedClass = MODE_TO_CLASS[mode] ?? mode;

  return { mode, task: taskId, rep, detected: detection.stance,
    confidence: detection.confidence, correct: detection.stance === expectedClass,
    metrics: detection.features as Record<string, number | boolean> };
}

async function main() {
  const trials: Array<{ mode: string; task: string; rep: number }> = [];

  for (const mode of Object.keys(MODES)) {
    for (let r = 0; r < REPS_PER_MODE; r++) {
      trials.push({ mode, task: TASKS[r % TASKS.length]!, rep: r });
    }
  }

  // Shuffle
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j]!, trials[i]!];
  }

  console.error(`\nValidation suite: ${trials.length} trials across ${Object.keys(MODES).length} modes\n`);

  const results: TrialResult[] = [];
  for (let i = 0; i < trials.length; i++) {
    const t = trials[i]!;
    console.error(`[${i + 1}/${trials.length}] ${t.mode} | ${t.task} | rep ${t.rep}`);
    const r = await runTrial(t.mode, t.task, t.rep);
    results.push(r);
    console.error(`  -> detected: ${r.detected} (${r.correct ? "OK" : "MISS"}) conf=${r.confidence}`);
    if (i < trials.length - 1) await new Promise(r => setTimeout(r, 800));
  }

  const modes = Object.keys(MODES);
  const overall = results.filter(r => r.correct).length / results.length;

  console.log(`\n# Detection Validation Report\n`);
  console.log(`Total trials: ${results.length} | Overall accuracy: ${(overall * 100).toFixed(1)}%\n`);

  console.log(`## Per-mode accuracy\n`);
  console.log(`| Mode     | N | Correct | Accuracy |`);
  console.log(`|----------|---|---------|----------|`);
  for (const mode of modes) {
    const mt = results.filter(r => r.mode === mode);
    const c = mt.filter(r => r.correct).length;
    console.log(`| ${mode.padEnd(8)} | ${mt.length} | ${c}       | ${((c / mt.length) * 100).toFixed(0)}%      |`);
  }

  console.log(`\n## Confusion matrix (rows=actual, cols=detected)\n`);
  const unique = [...new Set([...modes, "neutral"])];
  console.log(`| actual\\det | ${unique.map(s => s.padEnd(8)).join(" | ")} |`);
  console.log(`|-----------|${unique.map(() => "----------").join("|")}|`);
  for (const actual of modes) {
    const row = unique.map(d => String(results.filter(r => r.mode === actual && r.detected === d).length).padEnd(8));
    console.log(`| ${actual.padEnd(9)} | ${row.join(" | ")} |`);
  }

  console.log(`\n## Error rates\n`);
  console.log(`| Mode     | FP | FN | FPR    | FNR    |`);
  console.log(`|----------|----|----|--------|--------|`);
  for (const mode of modes) {
    const fp = results.filter(r => r.mode !== mode && r.detected === mode).length;
    const fn = results.filter(r => r.mode === mode && r.detected !== mode).length;
    const neg = results.filter(r => r.mode !== mode).length;
    const pos = results.filter(r => r.mode === mode).length;
    console.log(`| ${mode.padEnd(8)} | ${String(fp).padEnd(2)} | ${String(fn).padEnd(2)} | ${((fp / neg) * 100).toFixed(0)}%    | ${((fn / pos) * 100).toFixed(0)}%    |`);
  }

  console.log(`\n## Verdict\n`);
  if (overall >= 0.7) {
    console.log(`PASS: ${(overall * 100).toFixed(1)}% overall accuracy meets the 70% threshold.`);
  } else {
    console.log(`FAIL: ${(overall * 100).toFixed(1)}% overall accuracy is below the 70% threshold.`);
    console.log(`Modes needing tuning:`);
    for (const mode of modes) {
      const modeTrials = results.filter(r => r.mode === mode);
      const acc = modeTrials.filter(r => r.correct).length / modeTrials.length;
      if (acc < 0.5) console.log(`  - ${mode}: ${(acc * 100).toFixed(0)}% (most confused with: ${mostConfused(results, mode)})`);
    }
  }
}

function mostConfused(results: TrialResult[], mode: string): string {
  const counts = new Map<string, number>();
  for (const m of results.filter(r => r.mode === mode && !r.correct))
    counts.set(m.detected, (counts.get(m.detected) ?? 0) + 1);
  let best = "none", bestN = 0;
  for (const [k, v] of counts) if (v > bestN) { best = k; bestN = v; }
  return best;
}

main().catch(e => { console.error(e); process.exit(1); });
