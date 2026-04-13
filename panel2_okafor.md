# Panel Response: Preliminary Data Analysis
## Dr. Adaeze Okafor — Computational Linguistics & NLP

### 1. Statistical power: we have none

With n=1 per cell, these SDs are larger than most of the between-condition differences. The neg-high/explicit LOC mean is 48.4 with SD=36.8 — that interval swallows every other condition whole. We cannot distinguish signal from noise at this sample size. The 40-trial design gives us descriptive snapshots, not inferential leverage. Anyone claiming a directional effect from this data is reading tea leaves. That said, the data is still useful — not for confirming hypotheses, but for identifying which hypotheses are *worth* scaling up.

### 2. System prompt contamination is the critical confound

This is the finding I want the panel to take most seriously. We are appending 50-100 tokens of emotional prime after approximately 14,000 tokens of Claude Code system prompt. That ratio — roughly 1:200 — is catastrophic for our design.

Transformer attention is not uniform. Positional and content-based attention patterns mean our prime is competing with dense, behaviorally-directive instruction text. The Claude Code prompt contains explicit directives about code quality, safety, and output formatting. These are not neutral filler — they are *functionally identical* to the kind of behavioral steering we are trying to accomplish with our prime, except they are 200x longer and positioned where the model has been trained to attend.

The near-uniform 60% recursive approach across all conditions is consistent with this interpretation. In the pilot without the system prompt overhead, we saw differentiation in approach type. Now we see none. The system prompt is likely acting as a behavioral anchor that our prime cannot overcome.

### 3. The reversed security finding

Neutral/explicit producing more security features than neg-high on parse-cron (10 vs 5-6) directly contradicts the vigilance-from-negativity hypothesis. Two explanations:

**Interference.** The Claude Code system prompt already encodes security-conscious behavior. A negative emotional prime may be introducing conflicting attentional demands — the model allocates capacity to processing the affective framing at the expense of the security heuristics already activated by the system prompt. Neutral priming creates no such interference, so the default security behavior passes through cleanly.

**Task specificity.** Security features concentrate in parse-cron and are zero for debounce. This suggests the metric is measuring task affordance, not emotional modulation. Parse-cron handles untrusted string input; debounce does not. The model responds to the task's attack surface regardless of prime.

Both explanations point to the same conclusion: we are measuring system-prompt behavior, not prime-induced behavior.

### 4. Switch to the raw API

Yes. This is not optional — it is a prerequisite for valid results. We need to run the identical 40-trial battery through the raw API with *only* our emotional prime as the system prompt. If we see differentiation there but not through Claude Code, we have isolated the confound. If we see no differentiation in either condition, the priming effect may genuinely be too weak at this token scale.

### 5. Required ablation before the 200-trial run

Run a 2x2 ablation before scaling:

| | Raw API (prime only) | Claude Code (prime appended) |
|---|---|---|
| **Negative-high** | 5 trials | 5 trials |
| **Neutral** | 5 trials | 5 trials |

Twenty trials total. Focus on parse-cron only, since that is where security variance appears. If the raw API shows neg-high > neutral on security features and Claude Code does not, we have confirmed the contamination and can proceed with the full run on the raw API. If neither shows differentiation, we need to revisit prime potency before spending resources on 200 trials.

### 6. Honest assessment

The preliminary data does not support the hypothesis. It does not clearly *refute* it either — the sample size prevents that. What it does is raise a serious methodological concern that must be resolved before any scaled run. The most parsimonious reading of the current data is that a 14k-token system prompt dominates model behavior, and a 50-100 token emotional prime appended to it has no detectable effect. The hypothesis may still be correct, but this experimental apparatus cannot test it.

We should not run 200 trials through Claude Code. We run the ablation first.
