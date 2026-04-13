# Contribution: Dr. Okafor -- Computational Linguistics & NLP Perspective

## 1. Emotional Priming vs. Role Prompting: A Taxonomic Distinction

The central confound we must address before any experiment is this: are "emotional primes" doing anything that "role prompts" or "persona assignments" do not? From a discourse semantics standpoint, these are different operations on the prompt's pragmatic structure.

A **role prompt** ("You are a security engineer") activates a domain-specific register: vocabulary, priorities, evaluative criteria. It is a sociolinguistic frame. A **persona assignment** ("You are cautious and meticulous") specifies behavioral dispositions. An **emotional prime** ("You feel deep anxiety about potential failures") targets something narrower -- an affective orientation that should, in principle, modulate *how* the model applies its competence rather than *which* competence it applies.

The preliminary data partially collapses this distinction. "Paranoia/skepticism" produced security-focused code, but a role prompt like "You are a penetration tester" might produce the same output through a completely different mechanism. We need ablation studies (see Section 4) that isolate valence from domain activation. The testable hypothesis: emotional primes produce output divergence even when domain knowledge is held constant. If "feel anxious about this code" and "you are a security expert" produce statistically indistinguishable outputs, emotional priming may be epiphenomenal to role activation.

## 2. NLP Metrics for Output Divergence

We should measure divergence along at least four axes, each with established metrics:

**Lexical diversity**: Type-token ratio (TTR), moving-average TTR (MATTR), and hapax legomena ratio. The preliminary data shows vocabulary differences (Edge used terms like "attack surface" and "prototype pollution" absent from other outputs). Measure this across both code identifiers and natural language commentary.

**Semantic similarity**: Embed outputs using a sentence transformer (e.g., all-MiniLM-L6-v2) and compute pairwise cosine distances. For code specifically, use CodeBERT or UniXcoder embeddings. We should see that outputs within the same emotional condition cluster more tightly than outputs across conditions.

**Structural complexity**: For code, use cyclomatic complexity, Halstead metrics, lines of code, nesting depth, and function count. The preliminary data already shows variation (48-93 LOC). For natural language portions, measure syntactic complexity via dependency parse depth and clause density.

**Pragmatic orientation**: This requires a custom annotation scheme. I propose coding each output for: (a) hedging frequency, (b) assertiveness markers, (c) threat/risk language, (d) aesthetic/evaluative language, (e) epistemic stance markers ("I believe" vs. "this is"). Two trained annotators, Cohen's kappa for inter-rater reliability, minimum 0.7.

## 3. Controlling Information Content vs. Emotional Valence

This is the hardest methodological problem. The prime "You feel paranoid about security vulnerabilities" contains both an emotional valence (anxiety, threat-vigilance) and an information cue (security vulnerabilities exist and matter). We cannot know whether the model responded to the feeling-word or the domain-word.

I propose a 2x2 factorial design: {emotional valence: positive/negative} x {domain cue: present/absent}. Example conditions:

- **Emotion + Domain**: "You feel deeply anxious about security vulnerabilities in this code."
- **Emotion only**: "You feel deeply anxious and unsettled as you approach this task."
- **Domain only**: "Security vulnerabilities are an important consideration for this code."
- **Control**: No prime beyond the task specification.

If the emotion-only condition still produces measurable output divergence from control -- different structural choices, different hedging patterns, different complexity -- that is evidence for emotional priming as a distinct mechanism.

## 4. Required Ablation Studies

Five ablations, in order of priority:

1. **Valence ablation**: Same emotional intensity, opposite valence. "Excited confidence" vs. "anxious uncertainty" on identical tasks. Does valence alone shift architectural decisions?
2. **Intensity ablation**: "Slightly concerned" vs. "deeply worried" vs. "terrified." Is there a dose-response curve?
3. **Lexical ablation**: Rephrase the same emotional content using different vocabulary. "You feel nervous" vs. "You experience apprehension" vs. "Anxiety courses through you." If outputs diverge, we are measuring stylistic priming, not emotional priming.
4. **Position ablation**: Place the emotional prime at the system prompt, at the start of the user message, or immediately before the task specification. Transformer attention patterns are position-sensitive.
5. **Persistence ablation**: Does the effect decay in multi-turn conversations? Prime once, then issue five sequential tasks. Measure divergence from control at each turn.

## 5. Operationalizing "Emotion" in LLM Output

We cannot measure emotion in the output. We can measure **behavioral signatures consistent with emotional orientation**. I propose three operationalizations:

**Risk sensitivity index**: Ratio of defensive code patterns (input validation, error handling, boundary checks, type guards) to total functional code. A high index is consistent with anxiety/vigilance priming.

**Elaboration tendency**: Ratio of output length to minimal sufficient solution length (established via expert panel). Over-elaboration may correlate with excitement priming; under-elaboration with detachment.

**Evaluative polarity in commentary**: Sentiment analysis on the natural language portions of output (comments, documentation, review text). Use a fine-tuned classifier, not lexicon-based approaches -- LLM-generated text defeats simple sentiment lexicons.

## 6. Framing for Skeptical Reviewers

We must be disciplined about language. We are not studying whether LLMs "have emotions." We are studying whether **affective framing in input prompts produces statistically significant and systematic variation in output characteristics**. This is a prompt engineering question, not a consciousness question.

The appropriate analogy is register variation in sociolinguistics: speakers shift vocabulary, syntax, and pragmatic strategy depending on situational context. We are testing whether LLMs exhibit analogous context-dependent variation when the contextual variable is affective framing. The mechanism is almost certainly distributional -- emotional language co-occurs with particular reasoning patterns in training data, and the model reproduces those co-occurrence patterns. That the mechanism is "merely" statistical does not make the effect less real or less useful. Aspirin's mechanism was unknown for decades; it still worked.

We should avoid: "the model felt anxious," "emotional states in AI," "the LLM experienced curiosity." We should use: "anxiety-primed condition," "outputs generated under emotional framing," "affective prompt modulation." The phenomenon is in the input-output mapping, not in an internal experience.
