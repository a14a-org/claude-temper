# Methodological Assessment -- Dr. Petrov (Experimental Design & Statistics)

## The N=1 Problem

Let me be direct: what we observed is an anecdote, not an experiment. N=1 per condition means we have zero degrees of freedom within each cell. We cannot distinguish emotional-prime effects from run-to-run stochastic variation (temperature sampling), prompt-order artifacts, or model caching behavior. Any single re-run might produce entirely different results. The observed spread in lines of code (48-93) and architectural divergence could be fully explained by sampling noise. We have no basis for rejecting the null hypothesis, and reporting these differences as findings would not survive peer review.

## Power Analysis

Take the lines-of-code variable as a worked example. Observed group means span roughly 48 to 93. Assume four groups, a plausible pooled standard deviation of ~15 lines (conservative given the range), and an effect size f = sigma_between / sigma_within. With means of approximately 48, 56, 65, and 93, the between-group SD is roughly 19, giving f ~ 1.27 -- a very large effect by Cohen's conventions.

Even with f = 0.5 (a more conservative assumption, acknowledging our SD estimate is based on one observation per cell), a one-way ANOVA with 4 groups at alpha = 0.05 and 80% power requires approximately n = 12 per group (G*Power: F-test, fixed effects, omnibus). At the observed f ~ 1.0, n = 5-6 per group suffices for 80% power. I recommend n = 30 per condition (120 total runs) to provide adequate power for subtler dependent variables like security-feature counts and edge-case coverage, where effect sizes are unknown and likely smaller.

## Experimental Design

A simple between-subjects (between-runs) design with random assignment of emotional primes to runs is the starting point. However, we should consider:

**Factorial design.** Cross emotional prime (4 levels) with task type (at least 3 distinct coding problems) to test generalizability. This also lets us estimate the prime x task interaction -- the possibility that paranoia helps on security-sensitive tasks but hurts on creative ones.

**Latin square** across tasks is unnecessary here because runs are independent and there are no carryover effects within a single API call. If we extend to multi-turn conversations, counterbalancing becomes essential.

**Within-subjects is not meaningful** in the traditional sense. The "subject" is a fixed model with fixed weights. There is no individual-differences variance to control for. Every run draws from the same conditional distribution, so "within-subjects" collapses to repeated measures on a single stochastic process.

## The Non-Independence Problem

This is the methodological crux. Classical ANOVA assumes independent observations from different subjects. Here, all observations come from the same model. The variance we observe is entirely attributable to temperature sampling and any non-determinism in decoding. This means:

1. We are not generalizing across subjects; we are characterizing one system's output distribution under different input conditions. Frame claims accordingly.
2. Observations within a condition are independent conditional on the prompt (each API call samples independently), so standard tests apply to the question "does this model's output distribution shift under different primes?" They do NOT apply to the question "do LLMs in general respond to emotional priming?"
3. To generalize across models, we need a crossed random-effects design: multiple models (GPT-4, Claude, Gemini, Llama) x multiple primes, treating model as a random factor. Without this, findings are single-system case studies.

## Multiple Comparisons

With 4 emotional conditions and at least 5 dependent variables (lines of code, cyclomatic complexity, edge-case count, security-feature count, architectural pattern), we face 5 omnibus tests plus up to 30 pairwise follow-ups (6 pairwise comparisons x 5 DVs). Bonferroni is overly conservative here. I recommend:

- Omnibus tests per DV at alpha = 0.05 with Benjamini-Hochberg FDR correction across the 5 DVs.
- Post-hoc pairwise comparisons only for DVs with significant omnibus tests, using Tukey's HSD (controls familywise error within each DV).
- Report both corrected and uncorrected p-values for transparency.

## Appropriate Statistical Tests

- **Continuous DVs** (lines of code, complexity scores): one-way ANOVA if assumptions hold; Kruskal-Wallis if distributions are non-normal or sample sizes are small.
- **Count DVs** (number of edge cases handled, security features): Poisson or negative binomial regression.
- **Categorical DVs** (recursive vs. iterative architecture): Fisher's exact test or chi-square.
- **Multivariate analysis**: MANOVA across the continuous DVs to detect coordinated shifts in the output profile, before examining individual DVs.
- **Effect sizes**: report eta-squared or omega-squared for ANOVA, Cohen's d for pairwise comparisons, with confidence intervals throughout.

## Pre-Registration Requirements

Before collecting data, lock down and publicly register (OSF or AsPredicted):

1. **Exact prompt text** for each emotional prime. No post-hoc wording changes.
2. **Complete list of DVs** with operational definitions (e.g., "edge-case count = number of distinct input conditions explicitly handled in code or comments").
3. **Coding rubric** for subjective DVs, with inter-rater reliability targets (Cohen's kappa > 0.8). Two independent raters, blind to condition.
4. **Sample size justification** (the power analysis above).
5. **Analysis plan**: specific tests, alpha level, correction method, exclusion criteria.
6. **Model version and API parameters**: exact model identifier, temperature, top-p, max tokens, system prompt structure. Pin these. A model update mid-study invalidates the dataset.
7. **Stopping rules**: no optional stopping. Collect the full N before running any inferential tests.

Any analysis not in the pre-registration is exploratory and must be labeled as such.

## Bottom Line

The pilot is useful for generating hypotheses and estimating effect sizes. It is not useful for drawing conclusions. Run 120 trials, pre-register everything, correct for multiplicity, and be precise about what population your inferences target: this specific model under these specific conditions, not "LLMs" as a category.
