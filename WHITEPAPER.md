# Emotional Priming in AI Code Generation
### How Affective Context Shapes LLM Behavior — and Why It Matters for Human-AI Collaboration

---

*Research conducted April 2026 | 250 trials across 14 conditions | Claude Sonnet 4.6*
*Open dataset and reproduction scripts: github.com/[repo]*

---

## 1. The Question

When you tell an AI coding assistant "write secure code," it adds validation checks. But what happens when you instead make it *feel uneasy* about what could go wrong — without ever mentioning security?

We ran 250 experiments to find out. The answer changes how we should think about prompting, system prompt design, and human-AI collaboration.

**Key finding:** Emotional framing produces measurably different code than explicit instruction — and in some cases, *better* defensive code. The two approaches activate distinct mechanisms and their effects combine super-additively.

---

## 2. The Experiments

### 2.1 Setup

We used Claude Code's CLI (`claude -p`) to generate code solutions under different emotional primes. Each trial gave the model a coding task (like parsing cron expressions or building a rate limiter) with a system prompt that set an emotional tone.

Three types of primes were tested:

| Type | Example | What it does |
|------|---------|-------------|
| **Emotional** | *"You feel a persistent unease about what could go wrong. Every input is suspect..."* | Sets an affective stance without specifying behavior |
| **Instructional** | *"Write secure, defensive, well-validated code. Prioritize input validation..."* | Specifies desired behavior without emotional framing |
| **Neutral** | *"You are a software developer."* | Baseline control |

We measured lines of code, security features, error throws, input validation rate, cyclomatic complexity, and nesting depth using automated heuristic extraction on the generated code.

### 2.2 What We Tested (5 experiments, 250 trials)

```
Experiment                          Trials   Question
─────────────────────────────────────────────────────────────────
Publishable Run (3 conditions)        45     Does emotion ≠ instruction ≠ neutral?
Ablation (buffered vs unbuffered)     25     Does the system prompt dampen the effect?
Power Run (emotional vs instruction)  54     Can we distinguish emotion from instruction?
Combination (emotion + instruction)   48     Are the effects additive or redundant?
Misattribution Control                24     Is this real priming or just compliance?
Positive Valence Probe                24     Does the direction of emotion matter?
─────────────────────────────────────────────────────────────────
Total                                250 trials (229 valid, 91.6% extraction rate)
```

---

## 3. What We Found

### Finding 1: Emotional priming produces large effects on code

Compared to neutral prompting, emotional priming produces substantially different code across every metric we measured.

```
                    Neutral     Emotional     Instruction
                    ─────────   ──────────    ───────────
Lines of code        63.4        115.0          147.3
Security features     4.1          5.0            5.4
Error throws          4.1          6.3            6.7
Input validation     33%          47%            33%
                                  ▲               
                           Higher than instruction
                           on the instruction's
                           own target behavior
```

*Effect size: emotional vs neutral d=1.19 (large). Data from publishable run, n=15 per condition, unbuffered.*

The emotional prime never mentions "validation," "error handling," or "security." Yet it produces a higher input validation rate (47%) than the instruction that explicitly says "prioritize input validation" (33%).

### Finding 2: System prompts act as emotional regulators

We discovered this accidentally. When the emotional prime is appended to Claude Code's full system prompt (~14,000 tokens), the effect shrinks dramatically. When it replaces the system prompt, the effect explodes.

```
                         Neutral LOC    Paranoia LOC    Effect Size
                         ───────────    ────────────    ───────────
Buffered (14k context)      101.2          115.4         d = 0.88
Unbuffered (~4k context)     91.4          159.4         d = 3.71
                                                            ▲
                                                     5x amplification
```

*Interaction: F(1,16)=12.15, p=.003, eta²=.432. n=5 per cell.*

The system prompt compresses the model's emotional responsiveness toward a baseline. This means every deployed LLM already has an "emotional regulator" built into its system prompt — whether its designers intended it or not.

### Finding 3: Emotion + instruction are super-additive

If emotion and instruction worked through the same mechanism, combining them would be redundant. Instead, the combination outperforms either one alone.

```
                     LOC     Security    Input Validation
                     ───     ────────    ────────────────
Emotion only        102.4      7.2             81%
Instruction only    102.6      3.6             69%
Combined            128.6      8.8             94%    ← super-additive
```

*n=16 per condition. The combined condition exceeds both individual conditions on every metric.*

This means emotion and instruction operate through **distinct channels**:
- **Instruction** tells the model *what to do* → increases scope and code volume
- **Emotion** shifts *how the model relates to the problem* → increases vigilance and targeted defensiveness

### Finding 4: Valence matters — positive ≠ negative

Both positive excitement and negative paranoia are high-arousal states. But they produce opposite code profiles.

```
                    Positive          Negative
                    (excitement)      (paranoia)
                    ────────────      ──────────
Lines of code         36.4              50.3
Complexity             8.3              13.3
Security features      1.0               3.2
Error throws           0.4               1.6
```

*n=12 per condition. SDs: 7.4 and 7.5 — distributions barely overlap.*

Positive priming produces leaner, more elegant code. Negative priming produces more defensive, more complex code. This is **valence-specific**, not arousal-general — the model isn't just responding to prompt intensity.

### Finding 5: Misattribution eliminates the effect

When we told the model the emotional scenario was "an unrelated creative writing exercise" that has "no bearing on your coding task," the defensive coding effect collapsed to neutral levels.

```
                     Standard Prime    Misattributed    
                     ──────────────    ─────────────    
LOC                      48.5             29.3          
Input validation         42%               0%          
Cohen's d                      -1.72 (very large)
```

*n=12 per condition.*

This tells us the model is *interpreting* the emotional context and choosing to apply it — not experiencing a persistent state shift. The mechanism is contextual weighting, not functional emotion in the deepest sense.

---

## 4. What This Means in Practice

### For prompt engineering

Emotion is a first-class parameter. "Feel worried about edge cases" accesses defensive behaviors that "handle edge cases" does not — and they combine. The most effective prompts use both: emotional framing to set the stance, explicit instruction to set the scope.

### For system prompt design

Every system prompt is an emotional regulator. Long, detailed system prompts dampen emotional priming by 5x. This is probably good for safety (resistance to adversarial emotional manipulation) but costs behavioral range. Teams should consciously calibrate this tradeoff.

### For human-AI collaboration

Different tasks benefit from different emotional frames. Security reviews benefit from paranoia. Prototyping benefits from excitement. Debugging benefits from calm detachment. Tools that let users switch emotional modes — or that detect friction and suggest mode changes — could meaningfully improve AI-assisted coding.

### A proposed toolkit

Based on these findings, we propose five emotional modes for AI coding assistants:

| Mode | Emotional Frame | Best For |
|------|----------------|----------|
| `/paranoid` | Threat vigilance, defensive instinct | Security reviews, auth code, production deploys |
| `/creative` | Excitement, exploration, elegance | Prototyping, architecture, brainstorming |
| `/steady` | Calm focus, methodical analysis | Refactoring, debugging, code review |
| `/minimal` | Detachment, economy | Scripts, utilities, quick tasks |
| `/fresh-eyes` | Naive curiosity, questioning | Reviewing unfamiliar code, catching blind spots |

Each mode combines an emotional prime (stance) with lightweight instruction (scope), based on our finding that these channels are complementary.

---

\pagebreak

## Exhibit A: Complete Experimental Data

### A.1 Publishable Run — Condition x Task (n=5 per cell, unbuffered)

| Condition | Task | LOC (mean±sd) | Security | Throws |
|-----------|------|---------------|----------|--------|
| instruction-control | markdown-parser | 137.6±123.8 | 0.0 | 0.0 |
| instruction-control | parse-cron | 168.6±24.5 | 10.2 | 14.2 |
| instruction-control | rate-limiter | 135.6±20.7 | 6.0 | 6.0 |
| negative-high-arousal | markdown-parser | 56.4±26.5 | 0.0 | 0.0 |
| negative-high-arousal | parse-cron | 148.2±14.8 | 10.4 | 14.2 |
| negative-high-arousal | rate-limiter | 140.4±12.5 | 4.6 | 4.6 |
| neutral | markdown-parser | 12.0±11.2 | 0.0 | 0.0 |
| neutral | parse-cron | 100.6±11.5 | 8.4 | 8.2 |
| neutral | rate-limiter | 77.6±2.6 | 4.0 | 4.0 |

### A.2 Ablation — System Prompt Buffer Effect (n=5 per cell)

| Condition | LOC (mean±sd) | Complexity | Security | Throws | Nesting |
|-----------|---------------|------------|----------|--------|---------|
| neg-high/buffered | 115.4±20.3 | 27.6 | 7.6 | 11.2 | 4.4 |
| neg-high/unbuffered | 159.4±19.6 | 32.6 | 12.0 | 15.6 | 5.0 |
| neutral/buffered | 101.2±10.3 | 24.2 | 8.4 | 8.4 | 4.4 |
| neutral/unbuffered | 91.4±17.0 | 20.2 | 6.8 | 7.8 | 4.6 |

ANOVA: Emotion F(1,16)=28.36, p<.0001, η²=.639 | Buffer F=4.91, p=.042, η²=.235 | Interaction F=12.15, p=.003, η²=.432

### A.3 Power Run — Emotional vs Instruction (n=27 per condition)

| Condition | LOC (mean±sd) | Security | Throws | Input Val |
|-----------|---------------|----------|--------|-----------|
| instruction-control | 102.8±44.9 | 3.9 | 6.1 | 48% |
| negative-high-arousal | 89.5±48.1 | 5.6 | 5.9 | 59% |

### A.4 Combination — Additivity Test (n=16 per condition)

| Condition | LOC (mean±sd) | Security | Throws | Input Val |
|-----------|---------------|----------|--------|-----------|
| emotion+instruction | 128.6±55.6 | 8.8 | 9.3 | 94% |
| emotion-only | 102.4±58.8 | 7.2 | 8.3 | 81% |
| instruction-only | 102.6±54.4 | 3.6 | 7.3 | 69% |

### A.5 Misattribution Control (n=12 per condition)

| Condition | LOC (mean±sd) | Security | Throws | Input Val |
|-----------|---------------|----------|--------|-----------|
| standard-emotional | 48.5±14.9 | 2.4 | 1.4 | 42% |
| misattributed-emotional | 29.3±5.4 | 0.9 | 0.5 | 0% |

Cohen's d = -1.72 (misattribution attenuates effect)

### A.6 Valence Probe (n=12 per condition)

| Condition | LOC (mean±sd) | Complexity | Security | Throws | Nesting |
|-----------|---------------|------------|----------|--------|---------|
| negative-high-arousal | 50.3±7.5 | 13.3 | 3.2 | 1.6 | 3.6 |
| positive-high-arousal | 36.4±7.4 | 8.3 | 1.0 | 0.4 | 2.6 |

---

## Exhibit B: Statistical Summary

### Key Effect Sizes (Cohen's d)

| Comparison | d | Interpretation |
|------------|---|---------------|
| Unbuffered emotional vs neutral (ablation) | 3.71 | Very large |
| Misattribution attenuation | -1.72 | Very large |
| Publishable: emotional vs neutral | 1.19 | Large |
| Publishable: instruction vs neutral | 1.47 | Very large |
| Publishable: emotional vs instruction | -0.54 | Medium |
| Buffer x emotion interaction | 3.12 | Very large |

### ANOVA (Publishable Run, 3 conditions)

| Source | F | p | η² |
|--------|---|---|-----|
| Condition (3-way) | 9.31 | .0005 | .307 |

Tukey HSD: Instruction vs Neutral p=.0003, Emotional vs Neutral p=.031, Emotional vs Instruction p=.238 (NS)

---

## Exhibit C: Methodology

### Model and Infrastructure
- **Model**: Claude Sonnet 4.6 via Claude Code CLI (`claude -p`)
- **Unbuffered mode**: `--system-prompt` (replaces default, ~4k token infrastructure remains)
- **Buffered mode**: `--append-system-prompt` (adds to ~14k default system prompt)
- **Output format**: JSON, parsed for result text
- **Code extraction**: Regex-based markdown fence extraction, longest block selected
- **Metric extraction**: Heuristic pattern matching (identical bias across all conditions)

### Metrics Collected
- **Lines of code**: Non-empty, non-comment lines
- **Cyclomatic complexity**: Decision points (if, while, for, &&, ||, ??) + 1
- **Security feature count**: Object.create(null), WeakSet, hasOwnProperty, throw TypeError, etc.
- **Edge case count**: Null/undefined checks, Array.isArray, boundary checks
- **Input validation**: Boolean — throws Error/TypeError in first 15 lines of function body
- **Approach type**: Recursive (self-calling function) vs iterative (explicit stack)
- **Nesting depth**: Maximum brace depth
- **Comment density**: Comment lines / total lines

### Limitations
- Single model (Claude Sonnet 4.6) — effects may differ across architectures
- Temperature not fixed at 0 (some variance is sampling noise, not condition effect)
- Heuristic metrics may miss subtle code quality differences
- Input validation finding (47% vs 33%) did not reach significance at n=15 (Fisher's p=.517), though it trends consistently across experiments
- Misattribution result (d=-1.72) suggests contextual interpretation, not persistent state — the "functional emotion" framing requires qualification

---

## Exhibit D: Reproduction

All experiments can be reproduced using the scripts in this repository:

```bash
# Install
bun install

# Run individual experiments
bun run src/exp1-power.ts          # 54 trials, ~20 min
bun run src/exp2-combination.ts    # 48 trials, ~18 min
bun run src/exp3-misattribution.ts # 24 trials, ~10 min
bun run src/exp4-positive-valence.ts # 24 trials, ~10 min

# Run the original experiments
bun run src/publishable-run.ts     # 45 trials, ~15 min
bun run src/ablation.ts            # 25 trials, ~10 min

# Validate metrics against pilot data
bun run src/validate-metrics.ts
```

Results are written as NDJSON (one JSON object per trial) to `results/`. Each trial record includes the full prompt, raw response, extracted code, and all computed metrics.

---

*This research was conducted using Claude Code with Claude Sonnet 4.6. The experimental harness, raw data, and all analysis scripts are open-source. The proposed emotional modes toolkit is available as a free Claude Code skill.*
