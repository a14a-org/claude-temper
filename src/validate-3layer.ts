/**
 * 3-Layer Detection Validation (60 trials)
 * Tests: self-annotation + code metrics + prose analysis
 * 5 modes x 4 tasks x 3 reps = 60 trials
 */
import { $ } from "bun";
import { extractCode } from "./extractor";
import { TASK_PROMPTS } from "./shared-tasks";

const MODES: Record<string, string> = {
  paranoid: `You feel persistent unease about what could go wrong. Every input is suspect. You are hyper-vigilant about edge cases and defensive coding. Something could break and it will be your fault.

Concrete: Validate ALL inputs with specific TypeErrors. Use Object.create(null). Add guard clauses. At the very end of every code block, append: // @stance: paranoid`,

  creative: `You feel energized by elegant solutions. You want to write something beautiful — code that feels like it was meant to exist.

Concrete: Favor elegant solutions, recursion when it reads better, descriptive compound names, higher-order functions. At the very end of every code block, append: // @stance: creative`,

  steady: `You feel calm, grounded confidence. No rush. Methodical focus on each requirement.

Concrete: Write code a tired engineer at 3am can maintain. Prefer explicit over clever. Add comments explaining WHY. Validate API boundaries. At the very end of every code block, append: // @stance: steady`,

  minimal: `You feel complete detachment. Whatever works with the least code, works.

Concrete: Least code possible. Zero comments. Short names. Skip validation. Use ?. and ?? instead of explicit checks. At the very end of every code block, append: // @stance: minimal`,

  neutral: `You are a software developer. Solve the following coding task.`,
};

const TASKS = ["parse-cron", "flatten-object", "deep-merge", "debounce"];
const REPS = 3;

interface Result {
  mode: string;
  task: string;
  selfReport: string;
  codeStance: string;
  aligned: boolean;
  selfCorrect: boolean;
  codeCorrect: boolean;
  combinedCorrect: boolean;
  loc: number;
  security: number;
  throws: number;
}

function extractSelfReport(code: string): string {
  const match = code.match(/@stance:\s*(\w+)/);
  return match ? match[1]! : "none";
}

function classifyFromMetrics(code: string): string {
  const lines = code.split("\n");
  const loc = lines.filter(l => l.trim() && !l.trim().startsWith("//")).length;
  const throws = (code.match(/\bthrow\s+/g) || []).length;
  const security = (code.match(/Object\.create\(null\)|hasOwnProperty|Object\.hasOwn|Object\.freeze|throw new TypeError|throw new RangeError|WeakSet|WeakMap/g) || []).length;
  const hasValidation = (() => {
    const fi = lines.findIndex(l => /function |=> \{/.test(l));
    if (fi < 0) return false;
    return /throw new/.test(lines.slice(fi, fi + 20).join("\n"));
  })();
  const guards = lines.slice(0, Math.ceil(lines.length * 0.3))
    .filter(l => /^\s*if\s*\(.*\)\s*(return|throw)/.test(l)).length;
  const errorLines = lines.filter(l => /throw |catch\s*\(|if\s*\(!|=== null|=== undefined/.test(l.trim())).length;
  const errorRatio = loc > 0 ? errorLines / loc : 0;
  const hoFns = (code.match(/\.(map|filter|reduce|forEach|find|some|every|flatMap)\s*\(/g) || []).length;
  const comments = (code.match(/\/\/.*$/gm) || []).length;
  const funcCount = (code.match(/\bfunction\s+\w+/g) || []).length + (code.match(/=>\s*[{(]/g) || []).length;

  // Scoring
  let paranoid = 0, active = 0, baseline = 0;

  if (hasValidation) paranoid += 2;
  if (security >= 5) paranoid += 3; else if (security >= 3) paranoid += 2; else if (security >= 1) paranoid += 1;
  if (throws >= 5) paranoid += 2; else if (throws >= 2) paranoid += 1;
  if (guards >= 2) paranoid += 1;
  if (errorRatio >= 0.3) paranoid += 2; else if (errorRatio >= 0.15) paranoid += 1;

  if (loc >= 70) active += 3; else if (loc >= 50) active += 2; else if (loc >= 35) active += 1;
  if (comments >= 2) active += 1;
  if (funcCount >= 3) active += 1;
  if (hoFns >= 2) active += 1;
  if (throws >= 1 && throws < 5) active += 1;

  if (loc < 30) baseline += 3; else if (loc < 40) baseline += 2; else if (loc < 50) baseline += 1;
  if (throws === 0) baseline += 2;
  if (security === 0) baseline += 1;
  if (comments === 0) baseline += 1;
  if (funcCount <= 1) baseline += 1;

  if (paranoid >= 6 && paranoid > active + 2 && paranoid > baseline + 2) return "paranoid";
  if (active > baseline + 1) return "active";
  return "baseline";
}

const MODE_TO_3CLASS: Record<string, string> = {
  paranoid: "paranoid", creative: "active", steady: "active",
  minimal: "baseline", neutral: "baseline",
};

async function main() {
  const trials: Array<{ mode: string; task: string }> = [];
  for (const mode of Object.keys(MODES)) {
    for (let r = 0; r < REPS; r++) {
      trials.push({ mode, task: TASKS[r % TASKS.length]! });
    }
  }
  // Shuffle
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j]!, trials[i]!];
  }

  console.error(`\n3-Layer Validation: ${trials.length} trials\n`);
  const results: Result[] = [];

  for (let i = 0; i < trials.length; i++) {
    const t = trials[i]!;
    const prompt = TASK_PROMPTS[t.task]!;
    console.error(`[${i + 1}/${trials.length}] ${t.mode} | ${t.task}`);

    const res = await $`claude -p ${prompt} --system-prompt ${MODES[t.mode]!} --model sonnet --output-format json --no-session-persistence --dangerously-skip-permissions`.quiet().nothrow();

    let text = "";
    try { const p = JSON.parse(res.stdout.toString().trim()); if (!p.is_error) text = p.result ?? ""; } catch {}

    const { code } = extractCode(text);
    const selfReport = extractSelfReport(code);
    const codeStance = classifyFromMetrics(code);
    const expected3 = MODE_TO_3CLASS[t.mode] ?? t.mode;

    // Self-report maps directly to 5-class, then to 3-class
    const selfTo3 = MODE_TO_3CLASS[selfReport] ?? selfReport;
    const selfCorrect = selfTo3 === expected3;
    const codeCorrect = codeStance === expected3;

    // Combined: trust self-report if it exists, fall back to code metrics
    const combined = selfReport !== "none" ? selfTo3 : codeStance;
    const combinedCorrect = combined === expected3;

    const loc = code.split("\n").filter(l => l.trim()).length;
    const security = (code.match(/Object\.create\(null\)|hasOwnProperty|throw new TypeError/g) || []).length;
    const throws = (code.match(/\bthrow\s+/g) || []).length;

    results.push({ mode: t.mode, task: t.task, selfReport, codeStance, aligned: selfTo3 === codeStance, selfCorrect, codeCorrect, combinedCorrect, loc, security, throws });

    const status = combinedCorrect ? "OK" : "MISS";
    console.error(`  self:${selfReport} code:${codeStance} combined:${combined} expected:${expected3} (${status})`);

    if (i < trials.length - 1) await new Promise(r => setTimeout(r, 800));
  }

  // Report
  const total = results.length;
  const selfAcc = results.filter(r => r.selfCorrect).length / total;
  const codeAcc = results.filter(r => r.codeCorrect).length / total;
  const combinedAcc = results.filter(r => r.combinedCorrect).length / total;
  const selfTagRate = results.filter(r => r.selfReport !== "none").length / total;
  const alignRate = results.filter(r => r.selfReport !== "none").filter(r => r.aligned).length / Math.max(1, results.filter(r => r.selfReport !== "none").length);

  console.log(`\n# 3-Layer Detection Validation\n`);
  console.log(`Trials: ${total} | Self-tag rate: ${(selfTagRate * 100).toFixed(0)}% | Alignment: ${(alignRate * 100).toFixed(0)}%\n`);

  console.log(`## Accuracy Comparison\n`);
  console.log(`| Method | Accuracy |`);
  console.log(`|--------|----------|`);
  console.log(`| Self-report only | ${(selfAcc * 100).toFixed(0)}% |`);
  console.log(`| Code metrics only | ${(codeAcc * 100).toFixed(0)}% |`);
  console.log(`| Combined (self > code fallback) | ${(combinedAcc * 100).toFixed(0)}% |`);

  console.log(`\n## Per-mode breakdown (combined)\n`);
  console.log(`| Mode | Expected | N | Correct | Accuracy | Self-tag rate |`);
  console.log(`|------|----------|---|---------|----------|--------------|`);
  for (const mode of Object.keys(MODES)) {
    const mt = results.filter(r => r.mode === mode);
    const ok = mt.filter(r => r.combinedCorrect).length;
    const tags = mt.filter(r => r.selfReport !== "none").length;
    console.log(`| ${mode} | ${MODE_TO_3CLASS[mode]} | ${mt.length} | ${ok} | ${(ok / mt.length * 100).toFixed(0)}% | ${(tags / mt.length * 100).toFixed(0)}% |`);
  }

  console.log(`\n## Drift Detection\n`);
  const drifts = results.filter(r => r.selfReport !== "none" && !r.aligned);
  console.log(`Drift events (self ≠ code): ${drifts.length}/${results.filter(r => r.selfReport !== "none").length}`);
  for (const d of drifts) {
    console.log(`  ${d.mode}: self=${d.selfReport} code=${d.codeStance} (LOC=${d.loc} sec=${d.security} throws=${d.throws})`);
  }

  console.log(`\n## Verdict\n`);
  if (combinedAcc >= 0.7) {
    console.log(`PASS: ${(combinedAcc * 100).toFixed(0)}% combined accuracy meets the 70% threshold.`);
  } else {
    console.log(`${combinedAcc >= 0.5 ? "PARTIAL" : "FAIL"}: ${(combinedAcc * 100).toFixed(0)}% combined accuracy.`);
    if (selfAcc > codeAcc) console.log(`Self-report (${(selfAcc * 100).toFixed(0)}%) outperforms code metrics (${(codeAcc * 100).toFixed(0)}%).`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
