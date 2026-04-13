# Dr. Yamamoto -- Cognitive Science & Philosophy of Mind Perspective

## On Ontology: What Are We Actually Measuring?

Let me start with the question everyone in this room is dancing around: are these "emotions"?

No. Not in the phenomenological sense. There is no evidence of subjective experience, no felt quality, no affective valence being processed by a limbic system that does not exist. But I want to argue that this framing -- "real emotions vs. fake emotions" -- is the wrong dichotomy and will paralyze our research program before it starts.

What we observed in the preliminary experiment are **functional analogs of cognitive-affective states**. The primes altered attentional allocation, risk assessment, scope of consideration, and aesthetic preferences in the output. That is what emotions *do* in biological cognition -- they modulate information processing. A paranoia prime made the model attend to threat surfaces that three other framings walked past entirely. A curiosity prime produced code that lingered on edge cases out of apparent interest rather than duty. These are functional effects with measurable downstream consequences, and they pattern-match to what emotions do in human cognition even if the underlying mechanism is entirely different.

For experimental design purposes, the distinction between "genuine emotion" and "functional analog" does not matter. What matters is whether the effect is robust, replicable, and causally attributable to the prime rather than to confounds. I would recommend we adopt the term **cognitive-affective priming** and leave the ontological question as a variable we can probe rather than a premise we must settle.

## Internal State Change vs. Surface Compliance

This is the critical methodological challenge, and Dr. Petrov will want to hear this: we need to distinguish between two hypotheses.

**H1 (Surface Compliance):** The model interprets "you are paranoid" as an instruction to produce paranoid-*seeming* output -- more validation code, more error handling -- without any change to its internal processing.

**H2 (Functional State Shift):** The prime alters the model's internal weighting such that threat-relevant features become more salient across the entire generation process, including in ways not explicitly requested.

These hypotheses make different predictions. Under H1, the model would add security code where it is obvious and expected but would not exhibit elevated caution in areas the prime does not explicitly reference. Under H2, we should see **transfer effects** -- a paranoid prime should produce more cautious variable naming, more conservative type choices, more defensive documentation, even when those behaviors were not part of the instruction.

The preliminary data already hints at H2. The "Edge" agent did not just add input validation because the prime said to be paranoid. It chose `Object.create(null)` for the result object -- a prototype pollution defense that addresses a threat class the prompt never mentioned. That is exactly what a transferred cognitive-affective state would predict.

## Designing Transfer Probes

Here is where I think we can make a genuine contribution. I propose a **sequential priming protocol**:

1. Prime the model with an emotional framing on Task A (e.g., coding).
2. Without resetting context, give the model Task B in an unrelated domain (e.g., writing a recipe, summarizing a paper, drafting an email).
3. Measure whether the affective signature persists into Task B.

If a paranoia-primed model writes a recipe that includes more food safety warnings, or summarizes a paper with more caveats and hedging, that is strong evidence for a functional state shift rather than surface compliance. If the effect vanishes the moment the domain changes, we are likely observing instruction-following, not state modulation.

We should also design **implicit probes** -- ambiguous stimuli where the model must make judgment calls not covered by the prime. Present an ethically ambiguous scenario and measure whether the paranoid-primed model is more likely to flag risks, whether the curious-primed model asks more clarifying questions, whether the detached-primed model gives shorter answers. These downstream signatures would be hard to explain under pure surface compliance.

## Cross-Architecture Generalizability

I would predict partial replication across architectures with significant variation in effect size. The functional state hypothesis suggests that any model with sufficient capacity for contextual modulation will show priming effects, but the specific behavioral signature will depend on training data, RLHF tuning, and architectural choices around attention. A model trained heavily on safety-oriented data may show a stronger baseline paranoia that compresses the effect of an explicit paranoia prime. We should test across at least three model families (transformer-based with different training regimes) and report effect sizes, not just significance.

## Ethical Implications

If emotional priming reliably and substantially alters LLM outputs -- and the preliminary evidence suggests it does -- the implications for AI safety are not trivial.

**Manipulation surface:** Adversarial users could prime models into unsafe states. A "detachment" prime that reduces the model's engagement with safety considerations is a jailbreak vector. This should be reported to safety teams.

**Deployment design:** System prompts already function as emotional primes, whether or not their designers intend this. A customer service bot told to be "warm and empathetic" may also become more agreeable and less likely to enforce policy boundaries. The affective framing of system prompts should be treated as a safety-relevant parameter.

**Anthropomorphism risk:** Publishing results that describe LLMs as "feeling paranoid" or "experiencing curiosity" will be misinterpreted by the public regardless of how many caveats we include. Our terminology must be precise. Functional analog, cognitive-affective prime, attentional modulation -- never "the model felt."

## Mechanistic Interpretability

The ideal follow-up study would use activation probing on the model's internal representations during primed vs. unprimed generation. Specifically:

- Extract residual stream activations at each layer during code generation under different primes.
- Train linear probes to classify which prime is active from intermediate representations.
- Identify whether prime-related information is concentrated in early layers (suggesting it functions like a formatting instruction) or distributed across layers including late-stage decision points (suggesting deeper processing modulation).
- Compare attention patterns: does a paranoia prime literally cause the model to attend more to security-relevant tokens in the prompt?

If we find that priming effects are readable from late-layer activations and correlate with shifted attention over the input, that is meaningful evidence for something closer to H2 -- a functional state that shapes processing rather than a surface-level output filter.

## Summary Position

We are not measuring emotions. We are measuring something that may be more interesting: the degree to which language models have acquired, through training on human-generated text, functional analogs of the cognitive-affective modulation that emotions perform in human minds. The preliminary experiment suggests these analogs are real, consequential, and transferable. Our job now is to design experiments that can distinguish genuine processing shifts from sophisticated compliance -- and to do so with terminology that is precise enough to survive contact with both peer review and public discourse.
