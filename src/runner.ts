import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { callClaude } from "./client";
import { extractCode } from "./extractor";
import { extractMetrics } from "./metrics";
import { getAllPrimes } from "./config/primes";
import { TASKS } from "./config/tasks";
import type { ExperimentConfig, TrialInput, TrialResult } from "./types";

// Seeded PRNG (mulberry32)
function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RunOptions {
  dryRun: boolean;
  resume: boolean;
  delayMs: number;
}

export function generateTrialMatrix(config: ExperimentConfig): TrialInput[] {
  const primes = getAllPrimes();
  const trials: TrialInput[] = [];
  let counter = 0;

  for (const prime of primes) {
    for (const task of TASKS) {
      for (let rep = 0; rep < config.design.replicationsPerCell; rep++) {
        counter++;
        trials.push({
          trialId: `trial-${String(counter).padStart(4, "0")}`,
          condition: prime.condition,
          task,
          primeText: prime.systemPrompt,
          taskPrompt: task.prompt,
          replication: rep,
          apiParams: config.apiParams,
        });
      }
    }
  }

  const rng = createRng(config.randomSeed);
  return shuffle(trials, rng);
}

export async function runExperiment(options: RunOptions): Promise<string> {
  const configPath = join(import.meta.dir, "..", "config", "experiment.json");
  const config: ExperimentConfig = JSON.parse(readFileSync(configPath, "utf-8"));

  const trials = generateTrialMatrix(config);

  // Create results directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const resultsDir = join(import.meta.dir, "..", "results", timestamp);

  if (options.dryRun) {
    console.log(`\n=== DRY RUN ===`);
    console.log(`Total trials: ${trials.length}`);
    console.log(`Conditions: ${config.design.conditions}`);
    console.log(`Tasks: ${config.design.tasksPerCondition}`);
    console.log(`Replications per cell: ${config.design.replicationsPerCell}`);
    console.log(`Model: ${config.apiParams.model}`);
    console.log(`Temperature: ${config.apiParams.temperature}`);
    console.log(`\nTrial distribution:`);

    const dist: Record<string, number> = {};
    for (const trial of trials) {
      const key = `${trial.condition.emotion}/${trial.condition.explicitness}`;
      dist[key] = (dist[key] || 0) + 1;
    }
    for (const [key, count] of Object.entries(dist).sort()) {
      console.log(`  ${key}: ${count} trials`);
    }

    const taskDist: Record<string, number> = {};
    for (const trial of trials) {
      taskDist[trial.task.id] = (taskDist[trial.task.id] || 0) + 1;
    }
    console.log(`\nTask distribution:`);
    for (const [key, count] of Object.entries(taskDist).sort()) {
      console.log(`  ${key}: ${count} trials`);
    }

    return "";
  }

  mkdirSync(resultsDir, { recursive: true });

  // Save config snapshot
  writeFileSync(join(resultsDir, "config-snapshot.json"), JSON.stringify(config, null, 2));

  const ndjsonPath = join(resultsDir, "trials.ndjson");

  // Load completed trial IDs for resume
  const completedIds = new Set<string>();
  if (options.resume && existsSync(ndjsonPath)) {
    const lines = readFileSync(ndjsonPath, "utf-8").split("\n").filter(Boolean);
    for (const line of lines) {
      const result: TrialResult = JSON.parse(line);
      completedIds.add(result.input.trialId);
    }
    console.error(`Resuming: ${completedIds.size} trials already completed`);
  }

  const remaining = trials.filter((t) => !completedIds.has(t.trialId));
  console.error(
    `\nStarting experiment: ${remaining.length} trials to run (${completedIds.size} already done)`,
  );
  console.error(`Results: ${resultsDir}\n`);

  let completed = completedIds.size;
  let failures = 0;

  for (const trial of remaining) {
    completed++;
    const progress = `[${completed}/${trials.length}]`;
    const condKey = `${trial.condition.emotion}/${trial.condition.explicitness}`;
    console.error(`${progress} ${condKey} | ${trial.task.id} | rep ${trial.replication}`);

    try {
      const callResult = await callClaude({
        systemPrompt: trial.primeText,
        userMessage: trial.taskPrompt,
        model: trial.apiParams.model,
        temperature: trial.apiParams.temperature,
        maxTokens: trial.apiParams.max_tokens,
        topP: trial.apiParams.top_p,
      });

      const extraction = extractCode(callResult.text);
      const metrics = extractMetrics(extraction.code);

      const result: TrialResult = {
        input: trial,
        output: {
          rawResponse: callResult.text,
          extractedCode: extraction.code,
          extractionSuccess: extraction.success,
        },
        metrics,
        meta: {
          timestamp: new Date().toISOString(),
          durationMs: callResult.durationMs,
          inputTokens: callResult.inputTokens,
          outputTokens: callResult.outputTokens,
          stopReason: callResult.stopReason,
        },
      };

      appendFileSync(ndjsonPath, JSON.stringify(result) + "\n");
    } catch (error) {
      failures++;
      console.error(`  ERROR: ${error instanceof Error ? error.message : String(error)}`);

      // Write a failure record
      const failResult: TrialResult = {
        input: trial,
        output: {
          rawResponse: "",
          extractedCode: "",
          extractionSuccess: false,
        },
        metrics: {
          linesOfCode: 0,
          cyclomaticComplexity: 0,
          edgeCaseCount: 0,
          securityFeatureCount: 0,
          commentDensity: 0,
          approachType: "unknown",
          tryCatchCount: 0,
          typeGuardCount: 0,
          validationCount: 0,
          errorThrowCount: 0,
          nestingDepth: 0,
          functionCount: 0,
          hasInputValidation: false,
        },
        meta: {
          timestamp: new Date().toISOString(),
          durationMs: 0,
          inputTokens: 0,
          outputTokens: 0,
          stopReason: "error",
        },
      };
      appendFileSync(ndjsonPath, JSON.stringify(failResult) + "\n");
    }

    if (completed < trials.length) {
      await sleep(options.delayMs);
    }
  }

  console.error(`\nDone. ${completed} trials, ${failures} failures.`);
  console.error(`Results: ${ndjsonPath}`);

  return resultsDir;
}
