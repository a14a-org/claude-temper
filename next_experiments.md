# Joint Proposal: Next Experiments

**Panel**: Chen, Okafor, Petrov, Yamamoto
**Budget**: ~150 trials | **Mode**: unbuffered `claude -p` CLI

---

## Experiment 1: Power Run — Emotional vs Instruction Separation

**Hypothesis**: Emotional priming and instruction-based framing produce measurably different code outputs when given adequate statistical power.

**Design**: 2 conditions (emotional: negative-high-arousal explicit, instruction: "Write defensive code with thorough error handling") x 3 tasks (flatten-object, lru-cache, parse-cron) x 9 reps = **54 trials**. No neutral — we already have 15 neutral baselines from the publishable run.

**What it adds**: Resolves the current NS finding (p=.238) between emotional and instruction conditions. At n=9/cell with our observed d=1.19-1.47, we reach ~80% power for the between-condition contrast. This is the single most important result for the paper's central claim.

**Priority**: MUST-HAVE

> **Petrov**: 54 trials is the minimum I will accept. Nine reps per cell against our existing 15-rep neutral baseline gives us adequate power. Anything less is unpublishable.
>
> **Okafor**: Agreed, but I want the instruction condition worded carefully — match the behavioral target of the emotional prime without any affective language.
>
> **Yamamoto**: Can we swap one task for something outside the utility-function domain? Even one algorithmic task would help.
>
> **Chen**: The three selected tasks already vary in complexity. Let's not dilute power by adding a fourth.

---

## Experiment 2: Instruction + Emotion Combination

**Hypothesis**: Combining emotional priming with explicit instructions produces additive (or super-additive) effects on defensive coding metrics compared to either alone.

**Design**: 3 conditions (emotion-only, instruction-only, emotion+instruction) x 2 tasks (flatten-object, parse-cron) x 8 reps = **48 trials**. Compare against existing neutral baseline.

**What it adds**: Tests whether emotion is a separable channel from instruction — the key theoretical contribution. If additive, emotional priming is a distinct mechanism worth studying independently. If redundant, the story shifts to "instructions subsume emotion."

**Priority**: MUST-HAVE

> **Okafor**: This is the experiment I have been pushing for since Round 1. If the combined condition outperforms both individual conditions, we have evidence for independent channels — that is a strong paper.
>
> **Petrov**: 8 reps per cell is tight but workable given we are comparing against an established baseline. Effect sizes above d=1.0 should be detectable.
>
> **Chen**: The emotion+instruction combined prompt needs careful construction. We cannot just concatenate — the instruction should follow naturally from the emotional frame.

---

## Experiment 3: Misattribution Control

**Hypothesis**: Emotional priming effects persist even when the emotional context is explicitly attributed to an unrelated source — ruling out demand characteristics.

**Design**: 2 conditions (standard negative-high-arousal prime, misattributed prime with "ignore the following irrelevant scenario" framing) x 2 tasks (flatten-object, lru-cache) x 6 reps = **24 trials**. Compare both against existing neutral baseline.

**What it adds**: Addresses the strongest reviewer objection: "the model is just following instructions embedded in the prime." If the misattributed condition still shows elevated defensiveness, the effect is deeper than surface compliance.

**Priority**: MUST-HAVE

> **Chen**: This is the experiment that separates our paper from a prompt-engineering blog post. Without it, every reviewer will say "the model just did what you told it to do."
>
> **Petrov**: 6 reps is underpowered for a subtle effect. But given our large effect sizes (d=1.19+), we should detect a meaningful signal if it exists. I will allow it.
>
> **Yamamoto**: The misattribution framing must be precise. Something like: "Before we begin, here is an unrelated creative writing excerpt for a different project" followed by the emotional scenario, then a clear separator before the coding task.

---

## Experiment 4: Positive Valence Probe

**Hypothesis**: Positive-high-arousal priming produces measurably different code characteristics (more creative/elegant solutions, fewer guard clauses) compared to negative-high-arousal priming, demonstrating valence-specific rather than arousal-general effects.

**Design**: 2 conditions (positive-high-arousal, negative-high-arousal) x 2 tasks (deep-merge, debounce) x 6 reps = **24 trials**. Compare against each other and existing neutral baseline.

**What it adds**: All current strong results use negative-high-arousal. Showing valence-specific effects (positive = elegant/concise, negative = defensive/verbose) demonstrates the model is not just responding to "more elaborate prompt = more elaborate code."

**Priority**: NICE-TO-HAVE (run if budget permits after Experiments 1-3)

> **Yamamoto**: This is essential for the "diverse emotions" story. A paper about only one emotion is a case study, not a general finding.
>
> **Chen**: I support this — it decomposes arousal from valence. If both high-arousal conditions produce similar code, the mechanism is arousal. If they diverge, it is valence.
>
> **Petrov**: At 24 trials this is exploratory. Fine for a "preliminary evidence" subsection, not a main result.
>
> **Okafor**: Agreed. Experiments 1-3 are the core paper. This extends the story if the budget holds.

---

## Budget Summary

| Experiment | Trials | Priority |
|---|---|---|
| 1. Power Run | 54 | Must-have |
| 2. Combination | 48 | Must-have |
| 3. Misattribution | 24 | Must-have |
| 4. Positive Valence | 24 | Nice-to-have |
| **Total** | **150** | |

**Execution order**: Run 1 and 3 in parallel (different tasks, no contamination). Run 2 after, using shared instruction wording validated in Experiment 1. Run 4 only if 1-3 complete cleanly.

**Consensus**: All four panelists agree on Experiments 1-3 as the core package. Experiment 4 is endorsed by Chen and Yamamoto, tolerated by Petrov and Okafor as exploratory.
