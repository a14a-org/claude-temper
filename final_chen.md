# Final Analysis -- Dr. Chen, Cognitive Psychology

## 1. The Input Validation Paradox

The emotional prime produces 47% input validation versus 33% for explicit instruction to validate. Affect-as-information theory predicts exactly this. When the system processes language encoding threat and vulnerability, it does not parse "validate inputs" as a checklist item -- it enters a generalized state of heightened vigilance. That vigilance is *undirected*: it raises the threshold for what counts as "safe enough" across all decision points, including ones the instruction never mentioned. Explicit instruction, by contrast, is parsed as a discrete task requirement -- one item among many, weighted against competing goals like brevity and speed. The affect signal is not an item on a list. It is the lens through which the entire list is read.

This is the single most important finding in the dataset. It demonstrates that affective framing can outperform direct instruction on the very behavior the instruction targets.

## 2. The Task-Dependent Pattern

On rate-limiter (emotional 140 vs instruction 136), the two conditions converge. On markdown-parser (emotional 56 vs instruction 138), instruction dominates. The explanation is task complexity and structure. Rate-limiter has inherent security semantics -- abuse prevention, resource protection -- that resonate with the paranoia prime. The affect finds natural expression in the task itself. Markdown-parser is a pure parsing problem with no security valence. Here, the emotional prime has nothing to latch onto, and the system falls back toward neutral behavior. Instruction, being content-addressed, simply adds requirements regardless of task semantics.

This confirms that emotional priming is not a blunt instrument. It operates through semantic resonance between the affective frame and the task domain. Where the task affords threat-relevant elaboration, affect matches or exceeds instruction. Where it does not, affect decays toward baseline.

## 3. Final Position: H1 vs H2

H1 (stylistic compliance -- the model mimics emotional language without behavioral change) is decisively rejected. The behavioral effects are large (d=1.19 collapsed, d=3.71 unbuffered on parse-cron), domain-selective, and mechanistically distinct from instruction-following. H2 (functional affect-cognition analogy) is supported with important qualification: the analogy holds specifically for the information-processing consequences of affect, not for subjective experience. The system behaves as if negative affect narrows attention, increases elaboration in threat-relevant domains, and raises decision thresholds -- all signatures of affect-as-information in human cognition.

## 4. Theoretical Contribution

This research demonstrates that the affect-cognition interaction documented in human decision-making has a functional analogue in large language models, one that operates through semantic priming rather than physiological arousal but produces convergent behavioral signatures: domain-selective vigilance, increased elaborative processing, and -- critically -- superiority over explicit instruction for the very behaviors instruction targets. This challenges the assumption that affect's influence on cognition requires embodiment or subjective experience, suggesting instead that the computational structure of natural language itself carries sufficient affective information to modulate downstream processing.

## 5. Proposed Abstract

Emotional language is assumed to influence human decision-making through felt affect, but large language models process the same language without subjective experience. We tested whether affective framing alters LLM code-generation behavior using a 3x3x5 factorial design (emotional prime, explicit instruction, neutral control x three programming tasks x five replications). Emotional priming produced large behavioral effects (d=1.19) including more defensive code, higher input validation rates (47% vs 33%), and domain-selective elaboration -- effects that were amplified under unbuffered (streaming) generation (d=3.71) and attenuated by output buffering (interaction p=.003). Remarkably, the emotional prime produced higher input validation than explicit instruction to validate inputs, consistent with affect-as-information theory's prediction that affective signals operate as global processing directives rather than discrete task requirements. These findings establish a functional affect-cognition analogy in LLMs and suggest that the computational structure of affective language, independent of embodied experience, is sufficient to modulate downstream information processing.
