import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { runExperiment } from "./runner";
import { generateReport } from "./report";

const args = process.argv.slice(2);
const command = args[0];

async function lockConfig(): Promise<void> {
  const configPath = join(import.meta.dir, "..", "config", "experiment.json");
  const raw = readFileSync(configPath, "utf-8");
  const config = JSON.parse(raw);

  if (config.lockedAt) {
    console.error(`Config already locked at ${config.lockedAt}`);
    console.error(`SHA-256: ${config.sha256}`);
    return;
  }

  // Hash the config without the lock fields
  const hashable = { ...config, lockedAt: null, sha256: null };
  const hash = createHash("sha256").update(JSON.stringify(hashable)).digest("hex");

  config.lockedAt = new Date().toISOString();
  config.sha256 = hash;

  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`Config locked at ${config.lockedAt}`);
  console.log(`SHA-256: ${hash}`);
}

async function main(): Promise<void> {
  switch (command) {
    case "run": {
      const dryRun = args.includes("--dry-run");
      const resume = args.includes("--resume");
      const delayMs = 1000;

      const resultsDir = await runExperiment({ dryRun, resume, delayMs });
      if (!dryRun && resultsDir) {
        generateReport(resultsDir);
      }
      break;
    }

    case "report": {
      const dir = args[1];
      if (!dir) {
        console.error("Usage: bun run src/index.ts report <results-dir>");
        process.exit(1);
      }
      generateReport(dir);
      break;
    }

    case "lock-config": {
      await lockConfig();
      break;
    }

    default:
      console.log(`Emotional Priming Experiment Harness

Usage:
  bun run src/index.ts run [--dry-run] [--resume]   Run the experiment
  bun run src/index.ts report <results-dir>          Generate report from results
  bun run src/index.ts lock-config                   Lock experiment config (pre-registration)
`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
