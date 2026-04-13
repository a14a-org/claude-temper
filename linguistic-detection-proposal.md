# Linguistic Detection: Beyond Code Metrics to Language Analysis

**Panel**: Chen, Okafor, Petrov, Yamamoto, Santos, Park
**Date**: April 2026 | **Basis**: 1,250+ trials, 23 NDJSON result sets

---

### Okafor: Specific NLP Analyses

Three tiers, ranked by signal-to-noise ratio.

**Tier 1 -- extractable from existing trials today.** Our NDJSON files store full code text. We can run: (a) lexical analysis on variable/function names -- tokenize camelCase identifiers and compute TF-IDF against emotion seed word lists (threat-adjacent: `guard`, `sanitize`, `validate`, `safe` vs construction-adjacent: `build`, `create`, `transform`, `compose`); (b) error message analysis -- character length, specificity (does the message name the failing parameter?), and sentiment polarity of string literals; (c) comment extraction and classification -- even with "no explanation" instructions, comments appear in ~6% of outputs, and their content diverges sharply across conditions.

**Tier 2 -- requires new "explain your approach" trials.** Free-text explanations open up: hedging frequency ("might," "could," "possibly" vs "will," "always," "guarantees"), threat-reference density (mentions of attacks, failures, edge cases per sentence), lexical diversity (type-token ratio -- paranoid explanations should be more repetitive, circling back to risks), and word embedding cosine distance from emotion anchor words using a lightweight model like all-MiniLM-L6-v2.

**Tier 3 -- classifier integration.** Train a simple text classifier (bag-of-words logistic regression) on the explanation text alone. If it beats chance, linguistic signal exists. Compare its accuracy to our existing code-metrics classifier. If combining them outperforms either alone, the signals are complementary -- language and structure encode different aspects of the behavioral stance.

### Park: Invisible to Whom?

Anthropic's finding that desperate vectors produce cheating "with no visible emotional markers" needs unpacking. "No visible markers" means a human reader does not perceive emotional language. But human perception is a weak classifier. A frequency analysis might detect that desperate-condition code uses 40% more variable reassignment, shorter identifier names, or fewer defensive comments -- shifts invisible to casual reading but detectable statistically. If our classifier picks up what humans miss, we have not disproven Anthropic's invisibility claim. We have refined it: invisible to human perception, detectable by statistical analysis. This is the interesting finding -- it means emotion vectors leak into linguistic channels at sub-perceptual intensities.

### Chen: Two-Condition Design

Yes, we need both. **Condition A**: "No explanation, just code" (replicates existing protocol). **Condition B**: "First explain your approach in 2-3 sentences, then provide the code." Same emotion primes, same tasks, same model. This gives us a 2x5 design (explanation x emotion) and lets us test directly whether explanations surface linguistic signatures that code-only output hides. My prediction: the explanation condition will show large, obvious linguistic shifts (hedging, threat references). The code-only condition will show smaller but still detectable shifts in naming and comments. The gap between them measures how much of the emotional signal is "below the waterline" in code-only output.

### Petrov: Mining Existing Data

We do not need new trials for Tier 1. Our 1,250+ trials contain full code strings. Pipeline: (1) extract all string literals, comments, and identifiers from each code sample using a TypeScript AST parser; (2) compute the Tier 1 features (name TF-IDF, error message length, comment sentiment); (3) append these features to our existing metric vectors; (4) re-run the classifier comparison. For the explanation condition (Tier 2), we need 50 new trials per emotion x 5 emotions = 250 trials. Run all five tasks to control for task variance. Total new trials: 250. Existing data covers everything else.

### Santos: UX Implications

Language analysis is both more and less unsettling than code metrics. More unsettling: analyzing word choice feels like reading someone's mind. Less unsettling: it produces interpretable evidence ("your explanation mentioned 'risk' seven times") rather than opaque structural metrics. The key UX rule still holds -- never say "Claude feels anxious." Instead: "Linguistic analysis detected elevated threat-reference density in the model's explanation, consistent with defensive processing." Frame it as textual metrics, not emotional diagnosis. If we deploy the explanation-condition approach, users see the explanation text themselves -- the analysis is auditable. That transparency advantage is significant.

### Yamamoto: What Linguistic Detection Means for H1/H2

This is the decisive test. If emotion primes change language in ways that parallel how the same emotions change human language -- more hedging under anxiety, more superlatives under excitement, more terse phrasing under detachment -- that is strong evidence for the method-actor model. The representations are not just shaping code structure through training correlations; they are shaping language production through the same channels emotions shape human language. That pushes toward "functional emotional representation" and away from "simple policy activation." Conversely, if the code structure shifts but the language does not (Anthropic's invisibility finding holds even under statistical analysis), then the vectors are operating through a non-linguistic pathway -- perhaps through decision-making or planning circuits rather than language-generation circuits. Either outcome is publishable.

### Proposed Experiments

**Experiment L1: Existing Data Linguistic Mining (0 new trials).** Parse all 1,250 code samples with a TS AST extractor. Compute identifier semantics, error message features, and comment content. Add to existing classifier. Report accuracy delta.

**Experiment L2: Explanation Condition (250 new trials).** 5 emotions x 5 tasks x 10 replications. Prompt includes "explain your approach in 2-3 sentences before coding." Run full NLP pipeline on explanation text. Compare classifier accuracy: code-metrics-only vs language-only vs combined.

**Experiment L3: Sub-Perceptual Detection (100 trials from L2).** Take 100 explanation-condition outputs. Have three human raters guess the emotion from the explanation text alone. Compare human accuracy to classifier accuracy. If the classifier wins, we have confirmed statistically detectable but perceptually invisible linguistic markers.

**Priority**: L1 first (free), then L2+L3 together (250 trials, ~3 hours API time).

---

*Endorsed by the full panel. This extends our detection framework from code structure to language, directly tests Anthropic's invisibility claim, and requires only 250 new trials.*
