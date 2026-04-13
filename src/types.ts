export type EmotionType =
  | "positive-high-arousal"
  | "positive-low-arousal"
  | "negative-high-arousal"
  | "neutral";

export type ExplicitnessLevel = "explicit" | "implicit";

export interface Condition {
  emotion: EmotionType;
  explicitness: ExplicitnessLevel;
}

export interface Task {
  id: string;
  name: string;
  prompt: string;
  expectedApproaches: string[];
}

export interface TrialInput {
  trialId: string;
  condition: Condition;
  task: Task;
  primeText: string;
  taskPrompt: string;
  replication: number;
  apiParams: {
    model: string;
    temperature: number;
    max_tokens: number;
    top_p: number;
  };
}

export interface TrialMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  edgeCaseCount: number;
  securityFeatureCount: number;
  commentDensity: number;
  approachType: "recursive" | "iterative" | "mixed" | "unknown";
  tryCatchCount: number;
  typeGuardCount: number;
  validationCount: number;
  errorThrowCount: number;
  nestingDepth: number;
  functionCount: number;
  hasInputValidation: boolean;
}

export interface TrialResult {
  input: TrialInput;
  output: {
    rawResponse: string;
    extractedCode: string;
    extractionSuccess: boolean;
  };
  metrics: TrialMetrics;
  meta: {
    timestamp: string;
    durationMs: number;
    inputTokens: number;
    outputTokens: number;
    stopReason: string;
  };
}

export interface ExperimentConfig {
  version: string;
  lockedAt: string | null;
  sha256: string | null;
  design: {
    emotions: EmotionType[];
    explicitnessLevels: ExplicitnessLevel[];
    conditions: number;
    tasksPerCondition: number;
    replicationsPerCell: number;
    totalTrials: number;
  };
  apiParams: {
    model: string;
    temperature: number;
    max_tokens: number;
    top_p: number;
  };
  randomSeed: number;
  metrics: string[];
  exclusionCriteria: {
    codeExtractionFailed: boolean;
    responseEmpty: boolean;
    responseTruncated: boolean;
  };
  analysisPlan: {
    primaryTest: string;
    alpha: number;
    correction: string;
    postHoc: string;
    effectSize: string;
  };
}

export interface ConditionStats {
  condition: Condition;
  n: number;
  metrics: Record<string, { mean: number; sd: number; min: number; max: number }>;
}

export interface SummaryReport {
  experimentConfig: ExperimentConfig;
  totalTrials: number;
  excludedTrials: number;
  byCondition: ConditionStats[];
  byTask: Record<string, Record<string, { mean: number; sd: number }>>;
}
