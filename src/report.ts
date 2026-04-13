import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { TrialResult, Condition, SummaryReport, ConditionStats } from "./types";

const ZERO_STAT = { mean: 0, sd: 0, min: 0, max: 0 };

function stat(m: Record<string, { mean: number; sd: number; min: number; max: number }>, key: string) {
  return m[key] ?? ZERO_STAT;
}

function conditionKey(c: Condition): string {
  return `${c.emotion}/${c.explicitness}`;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sd(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function loadTrials(ndjsonPath: string): TrialResult[] {
  const lines = readFileSync(ndjsonPath, "utf-8").split("\n").filter(Boolean);
  return lines.map((line) => JSON.parse(line) as TrialResult);
}

const NUMERIC_METRICS = [
  "linesOfCode",
  "cyclomaticComplexity",
  "edgeCaseCount",
  "securityFeatureCount",
  "commentDensity",
  "tryCatchCount",
  "typeGuardCount",
  "errorThrowCount",
  "nestingDepth",
  "functionCount",
] as const;

function computeConditionStats(trials: TrialResult[]): ConditionStats[] {
  const groups = new Map<string, TrialResult[]>();

  for (const trial of trials) {
    const key = conditionKey(trial.input.condition);
    const group = groups.get(key) ?? [];
    group.push(trial);
    groups.set(key, group);
  }

  const stats: ConditionStats[] = [];

  for (const [key, group] of groups) {
    const [emotion, explicitness] = key.split("/");
    const metricsMap: Record<string, { mean: number; sd: number; min: number; max: number }> = {};

    for (const metric of NUMERIC_METRICS) {
      const values = group.map((t) => t.metrics[metric] as number);
      metricsMap[metric] = {
        mean: Math.round(mean(values) * 100) / 100,
        sd: Math.round(sd(values) * 100) / 100,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }

    // Approach type distribution
    const approaches = group.map((t) => t.metrics.approachType);
    const approachCounts: Record<string, number> = {};
    for (const a of approaches) {
      approachCounts[a] = (approachCounts[a] || 0) + 1;
    }
    metricsMap["approachType_recursive"] = {
      mean: (approachCounts["recursive"] || 0) / group.length,
      sd: 0, min: 0, max: 0,
    };
    metricsMap["approachType_iterative"] = {
      mean: (approachCounts["iterative"] || 0) / group.length,
      sd: 0, min: 0, max: 0,
    };

    // Input validation rate
    const validationRate = group.filter((t) => t.metrics.hasInputValidation).length / group.length;
    metricsMap["inputValidationRate"] = { mean: validationRate, sd: 0, min: 0, max: 0 };

    stats.push({
      condition: {
        emotion: emotion as Condition["emotion"],
        explicitness: explicitness as Condition["explicitness"],
      },
      n: group.length,
      metrics: metricsMap,
    });
  }

  return stats.sort((a, b) => conditionKey(a.condition).localeCompare(conditionKey(b.condition)));
}

function computeTaskStats(
  trials: TrialResult[],
): Record<string, Record<string, { mean: number; sd: number }>> {
  const groups = new Map<string, TrialResult[]>();

  for (const trial of trials) {
    const key = trial.input.task.id;
    const group = groups.get(key) ?? [];
    group.push(trial);
    groups.set(key, group);
  }

  const result: Record<string, Record<string, { mean: number; sd: number }>> = {};

  for (const [taskId, group] of groups) {
    result[taskId] = {};
    for (const metric of NUMERIC_METRICS) {
      const values = group.map((t) => t.metrics[metric] as number);
      result[taskId][metric] = {
        mean: Math.round(mean(values) * 100) / 100,
        sd: Math.round(sd(values) * 100) / 100,
      };
    }
  }

  return result;
}

function formatMarkdownReport(
  trials: TrialResult[],
  condStats: ConditionStats[],
  taskStats: Record<string, Record<string, { mean: number; sd: number }>>,
): string {
  const excluded = trials.filter((t) => !t.output.extractionSuccess);
  const valid = trials.filter((t) => t.output.extractionSuccess);

  let md = `# Emotional Priming Experiment — Results Report\n\n`;
  md += `**Date:** ${new Date().toISOString().slice(0, 10)}\n`;
  md += `**Total trials:** ${trials.length}\n`;
  md += `**Valid trials:** ${valid.length}\n`;
  md += `**Excluded:** ${excluded.length} (extraction failures)\n\n`;

  // Key metrics table by condition
  md += `## Results by Condition\n\n`;
  md += `| Condition | N | LOC | Complexity | Edge Cases | Security | Nesting | Throws | Input Val. |\n`;
  md += `|-----------|---|-----|------------|------------|----------|---------|--------|------------|\n`;

  for (const s of condStats) {
    const key = conditionKey(s.condition);
    const m = s.metrics;
    const g = (k: string) => stat(m, k);
    md += `| ${key} | ${s.n}`;
    md += ` | ${g("linesOfCode").mean} (${g("linesOfCode").sd})`;
    md += ` | ${g("cyclomaticComplexity").mean} (${g("cyclomaticComplexity").sd})`;
    md += ` | ${g("edgeCaseCount").mean} (${g("edgeCaseCount").sd})`;
    md += ` | ${g("securityFeatureCount").mean} (${g("securityFeatureCount").sd})`;
    md += ` | ${g("nestingDepth").mean} (${g("nestingDepth").sd})`;
    md += ` | ${g("errorThrowCount").mean} (${g("errorThrowCount").sd})`;
    md += ` | ${Math.round(g("inputValidationRate").mean * 100)}%`;
    md += ` |\n`;
  }

  // Approach type distribution
  md += `\n## Approach Type by Condition\n\n`;
  md += `| Condition | Recursive % | Iterative % |\n`;
  md += `|-----------|-------------|-------------|\n`;

  for (const s of condStats) {
    const key = conditionKey(s.condition);
    const rec = Math.round((s.metrics["approachType_recursive"]?.mean ?? 0) * 100);
    const iter = Math.round((s.metrics["approachType_iterative"]?.mean ?? 0) * 100);
    md += `| ${key} | ${rec}% | ${iter}% |\n`;
  }

  // Task breakdown
  md += `\n## Results by Task\n\n`;
  md += `| Task | LOC | Complexity | Edge Cases | Security |\n`;
  md += `|------|-----|------------|------------|----------|\n`;

  for (const [taskId, taskMetrics] of Object.entries(taskStats)) {
    const tg = (k: string) => taskMetrics[k] ?? { mean: 0, sd: 0 };
    md += `| ${taskId}`;
    md += ` | ${tg("linesOfCode").mean} (${tg("linesOfCode").sd})`;
    md += ` | ${tg("cyclomaticComplexity").mean} (${tg("cyclomaticComplexity").sd})`;
    md += ` | ${tg("edgeCaseCount").mean} (${tg("edgeCaseCount").sd})`;
    md += ` | ${tg("securityFeatureCount").mean} (${tg("securityFeatureCount").sd})`;
    md += ` |\n`;
  }

  // Effect sizes (emotion main effect)
  md += `\n## Preliminary Effect Sizes (Emotion Main Effect)\n\n`;
  md += `Comparing means across emotion levels (collapsed across explicitness):\n\n`;

  const emotionGroups = new Map<string, ConditionStats[]>();
  for (const cs of condStats) {
    const group = emotionGroups.get(cs.condition.emotion) ?? [];
    group.push(cs);
    emotionGroups.set(cs.condition.emotion, group);
  }

  for (const metric of ["linesOfCode", "securityFeatureCount", "edgeCaseCount", "errorThrowCount"] as const) {
    const emotionMeans: Record<string, number> = {};
    for (const [emotion, emotionStats] of emotionGroups) {
      const allValues = emotionStats.flatMap((es) => [stat(es.metrics, metric).mean]);
      emotionMeans[emotion] = mean(allValues);
    }
    md += `**${metric}**: `;
    md += Object.entries(emotionMeans)
      .map(([e, m]) => `${e}=${m.toFixed(1)}`)
      .join(", ");
    md += `\n`;
  }

  return md;
}

export function generateReport(resultsDir: string): void {
  const ndjsonPath = join(resultsDir, "trials.ndjson");
  const trials = loadTrials(ndjsonPath);

  const validTrials = trials.filter((t) => t.output.extractionSuccess);
  const condStats = computeConditionStats(validTrials);
  const taskStats = computeTaskStats(validTrials);

  const summary: SummaryReport = {
    experimentConfig: JSON.parse(
      readFileSync(join(resultsDir, "config-snapshot.json"), "utf-8"),
    ),
    totalTrials: trials.length,
    excludedTrials: trials.length - validTrials.length,
    byCondition: condStats,
    byTask: taskStats,
  };

  writeFileSync(join(resultsDir, "summary.json"), JSON.stringify(summary, null, 2));

  const markdown = formatMarkdownReport(trials, condStats, taskStats);
  console.log(markdown);

  writeFileSync(join(resultsDir, "report.md"), markdown);
  console.error(`\nSummary written to ${join(resultsDir, "summary.json")}`);
  console.error(`Report written to ${join(resultsDir, "report.md")}`);
}
