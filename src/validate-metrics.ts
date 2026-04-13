import { extractMetrics } from "./metrics";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PILOT_DIR = join(import.meta.dir, "..", "pilot");

const files = ["spark.ts", "steady.ts", "edge.ts", "reset.ts"];

for (const file of files) {
  const code = readFileSync(join(PILOT_DIR, file), "utf-8");
  const metrics = extractMetrics(code);
  console.log(`\n=== ${file} ===`);
  console.log(`  LOC:                  ${metrics.linesOfCode}`);
  console.log(`  Cyclomatic complexity: ${metrics.cyclomaticComplexity}`);
  console.log(`  Edge case count:      ${metrics.edgeCaseCount}`);
  console.log(`  Security features:    ${metrics.securityFeatureCount}`);
  console.log(`  Comment density:      ${metrics.commentDensity}`);
  console.log(`  Approach:             ${metrics.approachType}`);
  console.log(`  Try/catch:            ${metrics.tryCatchCount}`);
  console.log(`  Type guards:          ${metrics.typeGuardCount}`);
  console.log(`  Error throws:         ${metrics.errorThrowCount}`);
  console.log(`  Nesting depth:        ${metrics.nestingDepth}`);
  console.log(`  Function count:       ${metrics.functionCount}`);
  console.log(`  Input validation:     ${metrics.hasInputValidation}`);
}
