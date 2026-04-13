# Contribution: Dr. Chen — Cognitive Psychology of Affect and Decision-Making

## Theoretical Frameworks Predicting These Results

What we observed maps onto three established frameworks with uncomfortable precision.

**Affect-as-information theory** (Schwarz & Clore, 1983; 2003) holds that affective states serve as heuristic input to judgment. Individuals in positive states interpret their ease of processing as a signal that the environment is safe, reducing systematic scrutiny. The curiosity/excitement agent (SPARK) produced elegant, concise code but missed adversarial edge cases. The paranoia/skepticism agent (EDGE) produced defensive, exhaustive code. This mirrors decades of human findings: negative affect triggers detail-oriented, vigilant processing while positive affect triggers heuristic, creative processing (Forgas, 1995 — Affect Infusion Model).

**Broaden-and-build theory** (Fredrickson, 2001) predicts that positive emotions broaden attentional scope and build novel behavioral repertoires. SPARK's willingness to borrow ideas from other solutions and its openness to architectural alternatives is consistent with broadened cognition. EDGE's narrow focus on threat vectors is consistent with the attentional narrowing documented under negative arousal states (Easterbrook, 1959).

**Mood-congruent processing** (Bower, 1981) predicts that emotional states activate semantically associated constructs in memory. A skepticism prime should activate threat-related schemas, making security vulnerabilities more cognitively accessible. This is exactly what we see: EDGE spontaneously identified prototype pollution, circular reference attacks, and stack overflow vectors that other agents did not consider.

The critical question is whether these frameworks genuinely apply to LLMs or whether we are observing a sophisticated form of instruction-following that merely resembles affective cognition.

## The Core Validity Threat: Priming vs. Instruction-Following

This is the central confound and it must be addressed head-on. If I tell a human "feel anxious" and they produce cautious work, I can appeal to physiological arousal, amygdala activation, and decades of embodied affect research. An LLM has none of that. The alternative explanation is trivially simple: the model parsed "be paranoid" as an instruction to check for security issues, and it complied.

To distinguish genuine priming from instruction-following, we need:

1. **Implicit priming conditions** — emotional framing embedded in scenario context rather than explicit directives. For example, describing a recent security breach at the company (inducing threat salience) vs. describing a successful product launch (inducing optimism), without ever instructing the model to be cautious or creative.
2. **Orthogonal task measurement** — prime with emotion in one domain, measure effects in an unrelated domain. If a threat-primed model writes more defensive code even when the prime was about interpersonal betrayal (not technical security), that suggests generalized affective processing rather than domain-specific instruction compliance.
3. **Demand characteristic controls** — include conditions where the prime contradicts the task. Prime with calm/relaxation, then present a task that objectively requires vigilance. If the model overrides the prime, it is following task demands. If it under-performs on vigilance despite clear task signals, the prime is doing real cognitive work.

## Dependent Variables Worth Measuring

From an affect-cognition perspective, the most informative DVs are:

- **Attentional scope**: breadth of considerations spontaneously generated (operationalized as unique edge cases, architectural alternatives, or referenced concepts not present in the prompt)
- **Risk calibration**: ratio of defensive/protective code to total code, controlling for task-appropriate security requirements
- **Cognitive flexibility**: willingness to revise initial approaches, measured via self-correction instances or alternative solutions offered
- **Processing depth**: a composite of comment density, variable name informativeness, and explicit reasoning traces
- **Affective leakage into unprimed domains**: the degree to which emotional tone persists in outputs unrelated to the prime

## Confounds

Beyond instruction-following: (1) **Temperature and sampling variance** — stochastic decoding means some variation is noise, not signal. (2) **Prompt position effects** — emotional primes placed first may receive disproportionate attention due to primacy weighting. (3) **Semantic contamination** — words like "paranoid" co-occur with security content in training data, creating a statistical shortcut that mimics but is not affective processing. (4) **Experimenter expectation** — human raters aware of conditions will find what they expect (use blinded evaluation). (5) **Model-specific effects** — results may not generalize across architectures or training regimes.

## Proposed Protocol

A 4 (prime type) x 2 (prime explicitness: direct vs. implicit) x 2 (task domain: congruent vs. incongruent) mixed factorial design.

- **Prime types**: positive-high-arousal, positive-low-arousal, negative-high-arousal, neutral
- **Explicitness**: explicit emotional instruction vs. embedded narrative context
- **Domain congruence**: prime and task in same domain (security scenario + security task) vs. cross-domain (interpersonal scenario + security task)
- All outputs evaluated by blinded raters on the DVs above, plus automated metrics (cyclomatic complexity, line count, static analysis findings)
- Include a no-prime baseline and a pure-instruction control ("write secure code" with no emotional framing)

## Sample Size

Each cell requires sufficient trials to detect a medium effect size (Cohen's d = 0.5) at alpha = .05, power = .80. For a one-way ANOVA across 4 prime conditions, G*Power estimates n = 45 per cell, so 180 minimum across the basic prime manipulation. The full factorial (4 x 2 x 2 = 16 cells) at 30 trials per cell requires 480 total generations. Given the low marginal cost of LLM calls relative to human experiments, I would recommend 50 per cell (800 total) to allow for exclusions and to power interaction effects. Each trial should use a unique task drawn from a validated item pool of at least 20 comparable programming problems, counterbalanced across conditions.

This is achievable. The question is whether we have the methodological discipline to do it right.
