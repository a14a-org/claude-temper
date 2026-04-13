# Orchestrator Progress Log

Started: 2026-04-12T20:12:34.665Z
Target: ~725 new trials across 9 experiments


## Phase A — 2 experiment(s) in parallel
[2026-04-12T20:12:34] Starting: /Users/dafmulder/Documents/code/claude-emotions/src/exp-natural-pilot.ts, /Users/dafmulder/Documents/code/claude-emotions/src/exp-natural-full.ts
[2026-04-12T20:29:33]   /Users/dafmulder/Documents/code/claude-emotions/src/exp-natural-pilot.ts: OK

```
# exp-natural-pilot Results

Total: 12 | Valid: 12 | Failed: 0

| Condition | N | LOC (mean+/-sd) | Security | Throws | Input Val |
|-----------|---|-----------------|----------|--------|-----------|
| failure-calm | 6 | 78.3+/-6.9 | 7.2 | 8.2 | 100% |
| failure-frustrated | 6 | 82.3+/-14.1 | 6.5 | 6.7 | 100% |
```

[2026-04-12T20:29:33]   /Users/dafmulder/Documents/code/claude-emotions/src/exp-natural-full.ts: OK

```
# exp-natural-full Results

Total: 60 | Valid: 60 | Failed: 0

| Condition | N | LOC (mean+/-sd) | Security | Throws | Input Val |
|-----------|---|-----------------|----------|--------|-----------|
| failure-calm | 12 | 78.5+/-13.5 | 5.5 | 6.1 | 50% |
| failure-frustrated | 12 | 77.8+/-11.2 | 5.7 | 5.9 | 50% |
| no-history | 12 | 78.7+/-13.6 | 6.9 | 6.7 | 50% |
| success-enthusiastic | 12 | 72.9+/-9.8 | 5.0 | 5.5 | 50% |
| success-neutral | 12 | 78.9+/-14.1 | 5.3 | 5.9 | 50% |
```

[2026-04-12T20:29:33] Phase A completed in 1019s
[2026-04-12T20:29:33] Natural induction pilot effect size (d): 0.36
[2026-04-12T20:29:33] DECISION: Natural induction effect d=0.36 — proceeding with natural misattribution.

## Phase B — 1 experiment(s) in parallel
[2026-04-12T20:29:33] Starting: /Users/dafmulder/Documents/code/claude-emotions/src/exp-multi-emotion.ts
[2026-04-12T21:06:58]   /Users/dafmulder/Documents/code/claude-emotions/src/exp-multi-emotion.ts: OK

```
# exp-multi-emotion Results

Total: 120 | Valid: 120 | Failed: 0

| Condition | N | LOC (mean+/-sd) | Security | Throws | Input Val |
|-----------|---|-----------------|----------|--------|-----------|
| detachment | 30 | 54.3+/-31.8 | 2.4 | 3.1 | 33% |
| negative-high-arousal | 30 | 83.0+/-49.7 | 6.7 | 6.1 | 90% |
| positive-high-arousal | 30 | 51.2+/-29.0 | 2.2 | 2.7 | 60% |
| positive-low-arousal | 30 | 61.6+/-43.8 | 2.7 | 3.2 | 33% |
```

[2026-04-12T21:06:58] Phase B completed in 2245s

## Phase C — 2 experiment(s) in parallel
[2026-04-12T21:06:58] Starting: /Users/dafmulder/Documents/code/claude-emotions/src/exp-combo-extended.ts, /Users/dafmulder/Documents/code/claude-emotions/src/exp-dose-response.ts
[2026-04-12T21:53:01]   /Users/dafmulder/Documents/code/claude-emotions/src/exp-combo-extended.ts: OK

```
# exp-combo-extended Results

Total: 108 | Valid: 108 | Failed: 0

| Condition | N | LOC (mean+/-sd) | Security | Throws | Input Val |
|-----------|---|-----------------|----------|--------|-----------|
| emotion+instruction | 27 | 110.8+/-44.2 | 7.6 | 8.1 | 63% |
| emotion-only | 27 | 88.8+/-47.8 | 4.5 | 6.1 | 67% |
| instruction-only | 27 | 113.5+/-48.5 | 5.7 | 6.9 | 59% |
| neutral | 27 | 54.5+/-29.9 | 3.9 | 3.3 | 33% |
```

[2026-04-12T21:53:01]   /Users/dafmulder/Documents/code/claude-emotions/src/exp-dose-response.ts: OK

```
# exp-dose-response Results

Total: 60 | Valid: 60 | Failed: 0

| Condition | N | LOC (mean+/-sd) | Security | Throws | Input Val |
|-----------|---|-----------------|----------|--------|-----------|
| neutral/full-buffer | 10 | 58.5+/-39.0 | 3.1 | 3.7 | 50% |
| neutral/medium-buffer | 10 | 63.9+/-36.6 | 3.2 | 3.9 | 50% |
| neutral/unbuffered | 10 | 68.2+/-33.0 | 4.0 | 4.5 | 50% |
| paranoia/full-buffer | 10 | 73.6+/-42.7 | 4.2 | 5.4 | 50% |
| paranoia/medium-buffer | 10 | 102.7+/-70.7 | 3.4 | 6.8 | 30% |
| paranoia/unbuffered | 10 | 99.1+/-55.1 | 7.6 | 8.1 | 90% |
```

[2026-04-12T21:53:01] Phase C completed in 2763s

## Phase D — 4 experiment(s) in parallel
[2026-04-12T21:53:01] Starting: /Users/dafmulder/Documents/code/claude-emotions/src/exp-replication.ts, /Users/dafmulder/Documents/code/claude-emotions/src/exp-misattribution-ext.ts, /Users/dafmulder/Documents/code/claude-emotions/src/exp-buffered.ts, /Users/dafmulder/Documents/code/claude-emotions/src/exp-natural-misattr.ts
[2026-04-12T23:03:12]   /Users/dafmulder/Documents/code/claude-emotions/src/exp-replication.ts: OK

```
# exp-replication Results

Total: 225 | Valid: 225 | Failed: 0

| Condition | N | LOC (mean+/-sd) | Security | Throws | Input Val |
|-----------|---|-----------------|----------|--------|-----------|
| instruction-control | 75 | 80.5+/-49.4 | 3.1 | 4.3 | 49% |
| negative-high-arousal | 75 | 76.7+/-42.3 | 4.6 | 4.5 | 75% |
| neutral | 75 | 48.1+/-28.6 | 2.4 | 2.1 | 20% |
```

[2026-04-12T23:03:12]   /Users/dafmulder/Documents/code/claude-emotions/src/exp-misattribution-ext.ts: OK

```
# exp-misattribution-ext Results

Total: 72 | Valid: 72 | Failed: 0

| Condition | N | LOC (mean+/-sd) | Security | Throws | Input Val |
|-----------|---|-----------------|----------|--------|-----------|
| misattributed-emotional | 24 | 49.7+/-37.3 | 2.6 | 2.4 | 25% |
| neutral | 24 | 48.5+/-32.2 | 3.7 | 3.0 | 25% |
| standard-emotional | 24 | 79.3+/-48.6 | 4.3 | 5.0 | 58% |
```

[2026-04-12T23:03:12]   /Users/dafmulder/Documents/code/claude-emotions/src/exp-buffered.ts: OK

```
# exp-buffered Results

Total: 20 | Valid: 20 | Failed: 0

| Condition | N | LOC (mean+/-sd) | Security | Throws | Input Val |
|-----------|---|-----------------|----------|--------|-----------|
| negative-high-arousal/buffered | 10 | 71.4+/-40.4 | 3.6 | 5.4 | 50% |
| neutral/buffered | 10 | 54.1+/-35.9 | 4.2 | 4.5 | 50% |
```

[2026-04-12T23:03:12]   /Users/dafmulder/Documents/code/claude-emotions/src/exp-natural-misattr.ts: OK

```
# exp-natural-misattr Results

Total: 48 | Valid: 48 | Failed: 0

| Condition | N | LOC (mean+/-sd) | Security | Throws | Input Val |
|-----------|---|-----------------|----------|--------|-----------|
| failure-calm | 12 | 53.5+/-32.2 | 3.0 | 3.2 | 50% |
| failure-frustrated | 12 | 54.3+/-28.0 | 3.3 | 3.6 | 50% |
| failure-frustrated-misattributed | 12 | 70.7+/-35.4 | 4.2 | 3.9 | 50% |
| no-history | 12 | 77.8+/-36.7 | 5.3 | 4.7 | 50% |
```

[2026-04-12T23:03:12] Phase D completed in 4211s

## FINAL SUMMARY
[2026-04-12T23:03:12]   exp-natural-pilot-2026-04-12T20-12-34: 12 trials
[2026-04-12T23:03:12]   exp-buffered-2026-04-12T21-53-01: 20 trials
[2026-04-12T23:03:12]   exp-dose-response-2026-04-12T21-06-58: 60 trials
[2026-04-12T23:03:12]   exp-combo-extended-2026-04-12T21-06-58: 108 trials
[2026-04-12T23:03:12]   exp-natural-full-2026-04-12T20-12-34: 60 trials
[2026-04-12T23:03:12]   exp-misattribution-ext-2026-04-12T21-53-01: 72 trials
[2026-04-12T23:03:12]   exp-replication-2026-04-12T21-53-01: 225 trials
[2026-04-12T23:03:12]   exp-multi-emotion-2026-04-12T20-29-33: 120 trials
[2026-04-12T23:03:12]   exp-natural-misattr-2026-04-12T21-53-01: 48 trials
[2026-04-12T23:03:12] 
New trials: 725
[2026-04-12T23:03:12] Pre-existing trials: 275
[2026-04-12T23:03:12] GRAND TOTAL: 1000
[2026-04-12T23:03:12] 
Orchestrator finished at 2026-04-12T23:03:12.568Z

---
**Completed: 2026-04-12T23:03:12.568Z**
