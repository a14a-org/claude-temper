/**
 * Master orchestrator: runs all 9 experiments in 4 phases,
 * up to 4 in parallel per phase. Logs progress between phases.
 * Designed to run autonomously for ~90 minutes.
 */

import { spawn } from "node:child_process";
import { appendFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const RESULTS_DIR = join(import.meta.dir, "..", "results");
const PROGRESS_FILE = join(RESULTS_DIR, "progress.md");

function log(msg: string) {
  const ts = new Date().toISOString().slice(0, 19);
  const line = `[${ts}] ${msg}`;
  console.error(line);
  appendFileSync(PROGRESS_FILE, line + "\n");
}

function logSection(title: string) {
  const line = `\n## ${title}\n`;
  console.error(line);
  appendFileSync(PROGRESS_FILE, line);
}

function runScript(scriptPath: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn("bun", ["run", scriptPath], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
      // Stream progress to console
      const lines = d.toString().split("\n").filter((l: string) => l.startsWith("["));
      for (const l of lines) process.stderr.write(`  ${scriptPath}: ${l}\n`);
    });

    proc.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    proc.on("error", () => resolve({ code: 1, stdout, stderr: "Process spawn failed" }));
  });
}

async function runPhase(name: string, scripts: string[]): Promise<void> {
  logSection(`Phase ${name} — ${scripts.length} experiment(s) in parallel`);
  log(`Starting: ${scripts.join(", ")}`);

  const startTime = Date.now();
  const results = await Promise.all(scripts.map((s) => runScript(s)));

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  for (let i = 0; i < scripts.length; i++) {
    const r = results[i]!;
    const status = r.code === 0 ? "OK" : `FAILED (exit ${r.code})`;
    log(`  ${scripts[i]}: ${status}`);

    // Log the summary table from stdout
    if (r.stdout.trim()) {
      appendFileSync(PROGRESS_FILE, "\n```\n" + r.stdout.trim() + "\n```\n\n");
    }
  }
  log(`Phase ${name} completed in ${elapsed}s`);
}

function countTrialsInDir(dirPrefix: string): number {
  try {
    const dirs = readdirSync(RESULTS_DIR).filter((d) => d.startsWith(dirPrefix));
    let total = 0;
    for (const dir of dirs) {
      const ndjson = join(RESULTS_DIR, dir, "trials.ndjson");
      if (existsSync(ndjson)) {
        total += readFileSync(ndjson, "utf-8").split("\n").filter(Boolean).length;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

function computeEffectSize(dir1Prefix: string, cond1: string, cond2: string): number {
  try {
    const dirs = readdirSync(RESULTS_DIR).filter((d) => d.startsWith(dir1Prefix));
    const trials: Array<{ condition: string; metrics: { linesOfCode: number } }> = [];

    for (const dir of dirs) {
      const ndjson = join(RESULTS_DIR, dir, "trials.ndjson");
      if (existsSync(ndjson)) {
        const lines = readFileSync(ndjson, "utf-8").split("\n").filter(Boolean);
        for (const line of lines) {
          const t = JSON.parse(line);
          if (t.extractionSuccess) trials.push(t);
        }
      }
    }

    const g1 = trials.filter((t) => t.condition === cond1).map((t) => t.metrics.linesOfCode);
    const g2 = trials.filter((t) => t.condition === cond2).map((t) => t.metrics.linesOfCode);

    if (g1.length < 2 || g2.length < 2) return 0;

    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    const sd = (a: number[]) => {
      const m = avg(a);
      return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
    };

    const pooledSd = Math.sqrt((sd(g1) ** 2 + sd(g2) ** 2) / 2);
    return pooledSd > 0 ? (avg(g1) - avg(g2)) / pooledSd : 0;
  } catch {
    return 0;
  }
}

async function main() {
  // Initialize progress file
  appendFileSync(
    PROGRESS_FILE,
    `# Orchestrator Progress Log\n\nStarted: ${new Date().toISOString()}\nTarget: ~725 new trials across 9 experiments\n\n`,
  );

  const SRC = join(import.meta.dir);

  // ═══ Phase A: Natural Induction (72 trials) ═══
  await runPhase("A", [
    join(SRC, "exp-natural-pilot.ts"),
    join(SRC, "exp-natural-full.ts"),
  ]);

  // Decision point: check natural induction effect size
  const naturalD = computeEffectSize("exp-natural-pilot", "failure-frustrated", "failure-calm");
  log(`Natural induction pilot effect size (d): ${naturalD.toFixed(2)}`);

  let skipNaturalMisattr = false;
  if (Math.abs(naturalD) < 0.3) {
    log("DECISION: Natural induction effect too small (d<0.3). Will skip natural misattribution in Phase D and add extra replication.");
    skipNaturalMisattr = true;
  } else {
    log(`DECISION: Natural induction effect d=${naturalD.toFixed(2)} — proceeding with natural misattribution.`);
  }

  // ═══ Phase B: Multi-Emotion (120 trials) ═══
  await runPhase("B", [
    join(SRC, "exp-multi-emotion.ts"),
  ]);

  // ═══ Phase C: Combination & Dose-Response (168 trials) ═══
  await runPhase("C", [
    join(SRC, "exp-combo-extended.ts"),
    join(SRC, "exp-dose-response.ts"),
  ]);

  // ═══ Phase D: Replication & Power (up to 365 trials) ═══
  const phaseD = [
    join(SRC, "exp-replication.ts"),
    join(SRC, "exp-misattribution-ext.ts"),
    join(SRC, "exp-buffered.ts"),
  ];

  if (!skipNaturalMisattr) {
    phaseD.push(join(SRC, "exp-natural-misattr.ts"));
  }

  await runPhase("D", phaseD);

  // ═══ Final Summary ═══
  logSection("FINAL SUMMARY");

  // Count all trials
  let totalNew = 0;
  const expDirs = readdirSync(RESULTS_DIR).filter((d) => d.startsWith("exp-"));
  for (const dir of expDirs) {
    const ndjson = join(RESULTS_DIR, dir, "trials.ndjson");
    if (existsSync(ndjson)) {
      const count = readFileSync(ndjson, "utf-8").split("\n").filter(Boolean).length;
      log(`  ${dir}: ${count} trials`);
      totalNew += count;
    }
  }

  // Count pre-existing
  const preExisting = readdirSync(RESULTS_DIR)
    .filter((d) => !d.startsWith("exp-") && !d.startsWith("."))
    .reduce((sum, dir) => {
      const files = ["trials.ndjson", "ablation.ndjson"];
      for (const f of files) {
        const path = join(RESULTS_DIR, dir, f);
        if (existsSync(path)) {
          sum += readFileSync(path, "utf-8").split("\n").filter(Boolean).length;
        }
      }
      return sum;
    }, 0);

  log(`\nNew trials: ${totalNew}`);
  log(`Pre-existing trials: ${preExisting}`);
  log(`GRAND TOTAL: ${totalNew + preExisting}`);
  log(`\nOrchestrator finished at ${new Date().toISOString()}`);

  appendFileSync(PROGRESS_FILE, `\n---\n**Completed: ${new Date().toISOString()}**\n`);
}

main().catch((err) => {
  log(`FATAL ERROR: ${err}`);
  process.exit(1);
});
