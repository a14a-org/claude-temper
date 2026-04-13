# Panel 2 Response: Dr. Chen — Cognitive Psychology of Affect and Decision-Making

## 1. Does this data support or challenge my Round 1 predictions?

Both, in instructive ways. My core prediction from affect-as-information theory held directionally: negative-high-arousal produced the most defensive code (highest LOC at 45.6, highest error throws at 2.4, and the only condition with above-baseline input validation at 40%). The positive conditions produced leaner code with fewer throws, consistent with the "safety signal" hypothesis where positive affect reduces systematic scrutiny.

What did not hold: approach type. I expected negative arousal to shift toward iterative strategies (the pilot showed this), but the real data shows 60% recursive across every condition. The model's algorithmic strategy appears to be task-determined, not affect-modulated. This is a meaningful null. It suggests that emotional primes may influence *how thoroughly* the model executes a strategy, not *which* strategy it selects.

## 2. What does task-dominance mean for affect-as-information?

The task variance is enormous and frankly expected. parse-cron at 89 LOC vs. lru-cache at 24.75 is a 3.6x ratio driven entirely by problem structure. In human affect research, we see the same pattern: task demands are the primary driver of behavior, and affect modulates at the margins. Schwarz (1990) was explicit that affect-as-information operates when other diagnostic information is absent or ambiguous. When the task clearly dictates what to do (implement an LRU cache), the prime has little room to operate.

This actually supports the framework rather than undermining it. The interesting signal is that negative-high-arousal/explicit still pushed parse-cron to 113 LOC vs. 75-81 in neutral. On the most complex task, where there is the most room for discretionary defensive coding, the prime had its largest absolute effect. That is textbook affect-as-information: the effect emerges in conditions of judgment ambiguity.

## 3. Is explicit > implicit consistent with priming literature?

No, and this concerns me. In the human literature, implicit priming typically produces *stronger* effects because explicit primes trigger correction processes (Strack et al., 1993; Wegener & Petty, 1997). When people know they are being influenced, they adjust. The fact that explicit primes (48.4 LOC) outperform implicit primes (42.8 LOC) in the negative-high-arousal condition suggests the model is not correcting for the prime. It is complying with it. This pattern is more consistent with instruction-following than genuine affective processing.

However, with n=5, this difference (48.4 vs 42.8) is well within noise given SDs of 36.8 and 28.4. I would not draw any conclusion from this contrast yet.

## 4. Protocol adjustments for the 200-trial run

First, **analyze within-task effects**. The current report collapses across tasks, but the signal lives in task-level interactions. Compute condition effects separately for each task, particularly parse-cron and deep-merge where there is room for discretionary behavior.

Second, **add a pure instruction control**. Include "write secure, well-validated code" with no emotional framing. If this produces effects equal to negative-high-arousal/explicit, we have our answer: it is instruction-following, not affective processing.

Third, **track specific defensive behaviors** rather than composite LOC. Input validation rate is the cleanest DV we have (40% vs. 20% is a binary, interpretable signal). Decompose LOC into functional code vs. defensive code.

Fourth, **increase to n=5 per cell minimum** even for the smoke test. n=1 cannot distinguish signal from sampling noise.

## 5. Are the effect sizes promising or concerning?

They are plausible but underpowered. The negative-high-arousal effect on LOC is roughly d=0.3 against neutral (45.6 vs. 37.7, pooled SD around 27). That is small by Cohen's conventions and would require approximately 175 trials per cell to detect reliably at 80% power. With 200 total trials across 8 cells (25 per cell), we will still be underpowered for the main effect.

The input validation signal is more promising: a 20-percentage-point jump in one condition is large if it replicates. That is what I would watch. The LOC and throws differences may be noise; the categorical behavior shift (does the model add input validation or not?) is the clearest test of whether the prime is doing cognitive work.

Honest assessment: we have a suggestive pattern that is entirely consistent with what we would expect from both genuine affect modulation *and* simple instruction compliance. The 200-trial run will not resolve that ambiguity without the instruction control condition. We need it.
