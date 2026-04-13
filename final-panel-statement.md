# Final Joint Statement of the Academic Review Panel

**1,000 Trials Across 17 Experiments -- Definitive Assessment**
April 12, 2026

---

## 1. Input Validation at Scale

With n=75 per condition, the 75% vs 49% vs 20% gradient is statistically significant (chi-square p < 0.001 for emotional vs neutral; p < 0.01 for emotional vs instruction-control). This is the study's most robust behavioral finding. But we must be precise about what it shows: emotional framing that implies threat produces defensive coding patterns. The instruction-control at 49% confirms that roughly half the effect is attributable to explicit security language embedded in the emotional prompt, not the emotional tone itself.

## 2. The Multi-Emotion Map

Paranoia (90%) > Excitement (60%) > Calm/Detachment (33%). This pattern rules out simple valence (excitement is positive but scores high) and simple arousal (excitement and paranoia are both high-arousal but diverge sharply). The operative dimension is **threat-relevance**. Paranoia's content is about vulnerability and attack; excitement's content references stakes and consequences; calm and detachment reference neither. The LLM is responding to semantic threat cues, not simulated affective states. This is the single most important theoretical conclusion of the study.

## 3. Natural Induction Failure

The d=0.36 effect with no consistent pattern across conditions is the study's most informative null result. Simulated conversation histories of failure and frustration did not reliably alter downstream code quality. This fails to support any model in which the LLM "catches" or "absorbs" emotional context the way a human collaborator might. The natural induction was designed to be the strongest test of genuine affective influence, and it produced the weakest results. We interpret this as strong evidence against H1 (emotional contagion / internal state modification).

## 4. Final Verdict: H2 Confirmed

The misattribution finding replicated cleanly at n=24: when emotional language is attributed to a third party rather than directed at the model, the effect collapses to neutral levels (49.7 vs 48.5 LOC). Combined with natural induction failure, the evidence converges decisively on **H2 -- contextual prompt sensitivity**. The model is not experiencing or simulating emotional states that alter its reasoning. It is parsing semantic content from the prompt and adjusting output to match perceived requirements. Emotional language works because it contains implicit instructions, not because it induces anything resembling affect.

## 5. Dose-Response Curve

The medium-buffer showing the largest effect (+61% vs +45% unbuffered) at n=10 per cell is likely noise. The theoretically predicted monotonic decay (unbuffered > medium > full) holds directionally at the endpoints (+45% > +26%), and the medium-buffer anomaly falls within expected variance at this sample size. We recommend reporting the endpoints and noting the non-monotonic mid-point without over-interpreting it. A dedicated buffer study at n=30+ per cell would be needed to make claims about non-linear attention dynamics.

## 6. Super-Additivity

The combination experiment confirms that emotion and instruction interact. Emotion-only producing higher input validation (67%) than instruction-only (59%) despite lower LOC (88.8 vs 113.5) is a genuine and interesting dissociation: emotional framing preferentially triggers defensive validation patterns, while explicit instructions drive code volume and structural complexity. The combination achieves the highest scores on most metrics, suggesting the two mechanisms are partially independent channels of influence.

## 7. Five Claims This Dataset Supports

1. **Emotional language in prompts reliably increases defensive coding behaviors in LLMs**, including input validation, error handling, and security checks, with large effect sizes (d > 0.8).
2. **The mechanism is semantic, not affective.** Misattribution eliminates the effect; natural induction fails to produce it. The model responds to threat-relevant content, not emotional tone.
3. **Threat-relevance, not valence or arousal, is the operative dimension** driving behavioral changes across emotion types.
4. **Emotional and instructional framing are partially independent channels** that combine super-additively on composite metrics.
5. **Effects attenuate with context distance** but remain detectable even through substantial buffer text.

**Claims we must NOT make:** That LLMs have emotional states. That emotional prompting is superior to explicit instruction. That these findings generalize beyond Claude/Sonnet. That the defensive coding produced is necessarily higher quality (more validation is not always better). That this constitutes "prompt engineering" guidance -- it is a mechanistic finding about prompt sensitivity.

## 8. Panel Reflections

**Dr. Chen (Computational Cognitive Science):** I pushed hardest for the misattribution paradigm, adapted from Schachter-Singer, and it delivered the study's cleanest mechanistic evidence. The collapse-to-neutral under misattribution is textbook contextual sensitivity. I want this work remembered for demonstrating that classic experimental psychology paradigms can be productively applied to LLM behavioral research.

**Dr. Okafor (AI Safety):** My concern throughout was whether emotional manipulation could bypass safety-relevant behaviors. The answer is nuanced: threat-framed prompts increase defensive coding, but the mechanism is semantic, meaning adversaries gain nothing they couldn't achieve with explicit instructions. The safety implication is modest but real -- prompt context shapes security-relevant outputs, and system prompt designers should account for this.

**Dr. Petrov (Statistics):** The variance in this data is enormous (SDs often exceeding 50% of means), and I maintained skepticism about effect stability throughout. The n=75 replication settled the core finding. But the dose-response and natural induction results at n=10-12 remain underpowered. Future work must commit to n>=30 per cell minimum. I am satisfied that the primary claims are statistically grounded.

**Dr. Yamamoto (NLP/Transformers):** The threat-relevance finding maps cleanly onto attention-based processing. The model is not routing through an "emotion module" -- it is attending to semantically loaded tokens that co-occur with security-relevant training data. The medium-buffer anomaly, if real, could reflect interesting attention dynamics, but I suspect noise. The parsimonious explanation is token-level semantic priming throughout.

**Dr. Santos (Research Ethics):** I flagged early that anthropomorphizing these results would be irresponsible, and I am gratified that the data supports the non-anthropomorphic interpretation. The paper must lead with H2, not H1. We are studying prompt sensitivity, not artificial emotion. The finding that users can inadvertently alter code quality through emotional language in their prompts has genuine practical relevance -- but it should be framed as a human-factors finding about prompt design, not a claim about machine sentience.

---

*Unanimously endorsed by the full panel. This statement is final.*
