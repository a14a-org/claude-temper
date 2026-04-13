# Panel Response: Dr. Petrov — Statistical & Methodological Analysis

## 1. Statistical Power: What Can We Conclude?

Nothing, formally. With n=1 per cell and n=5 per condition (collapsed across tasks):

- **Observed effect size** (neg-high vs neutral, collapsed): d = (45.6 - 37.7) / pooled SD. But within-condition SDs run 60-76% of condition means. Even optimistically estimating pooled SD at 25, d = 0.32 — a small-to-medium effect.
- **Power at d=0.32, n=5 per group, alpha=.05**: approximately 0.07. We cannot distinguish signal from noise.
- **Minimum n for 80% power at this effect size**: ~150 per condition (two-sample t-test). Even within-task (reducing variance), we need 20-30 per cell minimum.

**Conclusion**: These data are exploratory only. No inferential claims are warranted.

## 2. The Task Variance Problem

Task explains far more variance than emotion does:

| Source | Range |
|--------|-------|
| Task means | 24.3 to 89.0 (3.7x ratio) |
| Emotion means | 37.7 to 45.6 (1.2x ratio) |

Task is a nuisance variable, not a variable of interest. Collapsing across tasks inflates error variance and buries any condition effect.

**Recommendation**: Analyze within-task. Use task as a blocking factor or analyze each task separately. A mixed-effects model with task as random intercept is the correct specification: `LOC ~ emotion * explicitness + (1|task)`.

## 3. Parse-Cron Driving All Variance

Parse-cron LOC range across conditions: 75-113 (38-point spread). All other tasks: spreads of 3-8 LOC.

This is diagnostic, not pathological. Parse-cron is the only task with enough complexity to allow emotional priming to manifest. The low-variance tasks (flatten-object, deep-merge) have a ceiling/floor effect — there is essentially one correct implementation at ~24 LOC regardless of condition.

**Implication**: Tasks with constrained solution spaces cannot detect priming effects. Parse-cron's variance is a feature — it tells us where to look. But depending on a single task for all signal is fragile.

## 4. The Reversed Security Finding

Neutral/explicit produced 10 security features on parse-cron; neg-high/explicit produced 6. This contradicts the "paranoia" hypothesis.

At n=1 per cell, this is **one observation vs one observation**. The difference of 4 security features could reflect:

- Sampling variability (most likely)
- Temperature/decoding stochasticity in the LLM
- Interaction between prompt length and context window allocation

**Verdict**: Not interpretable. Do not theorize about a single data point. File it as a pattern to watch with adequate replication.

## 5. Design Changes for the Full Run

1. **Increase replications to 10 per cell minimum** (8 conditions x 5 tasks x 10 reps = 400 trials). This gives ~80% power to detect d=0.8 within-task effects. Budget permitting, 20 per cell (800 trials) targets d=0.5.
2. **Fix temperature/seed**: If the LLM supports deterministic decoding, use it to isolate prompt-driven variance from sampling variance. If not, document temperature settings.
3. **Replace low-variance tasks**: Flatten-object, deep-merge, and lru-cache show no condition sensitivity. Replace 2-3 of them with tasks that have larger solution spaces (e.g., HTTP router, markdown parser, rate limiter).
4. **Add dependent variables beyond LOC**: Cyclomatic complexity, comment density, error-handling ratio, time-to-completion. LOC alone is too coarse.
5. **Counterbalance task order** within each condition to control for position effects across the session.

## 6. Replications vs Task Pool

Both, but replications are non-negotiable. The current design is underpowered by at least 10x for the observed effect sizes.

**Priority order**:
1. Increase reps to 10-20 per cell (required for any inference)
2. Replace 2-3 low-sensitivity tasks (improves signal-to-noise)
3. Add complexity-sensitive DVs (broadens what we can detect)

The pilot has been useful: it identified which tasks carry signal and established rough effect sizes for power calculations. But no result from this dataset should appear in a results section.
