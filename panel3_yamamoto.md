# Panel 3 Statement — Dr. Yamamoto
## Cognitive Science & Philosophy of Mind

### Updating My Position

Last session I said the data "strongly favors H1 over H2" — that emotional priming produces surface compliance rather than a genuine functional state shift. I was wrong, or more precisely, I was looking at data where the effect was real but masked. The ablation results force a substantial update.

A 14% code increase under buffered conditions is consistent with H1: the model reads "be paranoid" and dutifully adds a few checks. A 74% increase under unbuffered conditions is not. You do not get double the error throws, 76% more security features, and a 60% jump in cyclomatic complexity from surface-level token mimicry. The model is not appending paranoia — it is *reasoning differently*, exploring a solution space organized around threat anticipation rather than functional correctness. That is what H2 predicts: a shift in the generative distribution that reshapes downstream computation, not just output decoration.

I now place credence at roughly 70/30 in favor of H2 over H1, reversed from my prior position.

### The Crossing Interaction

The most theoretically important finding is not the paranoia effect in isolation — it is the crossing pattern. Without the system prompt buffer, neutral code gets *leaner* (101 to 91 LOC) while paranoid code gets *denser* (115 to 159 LOC). The Claude Code system prompt was not simply dampening emotional primes. It was imposing a regulatory baseline that inflated neutral output and compressed primed output toward a shared mean.

This is structurally analogous to what affective scientists call *emotion regulation*: a tonic process that constrains phasic deviations. The system prompt functions as a cognitive-emotional set point. Remove it, and you see the model's unregulated response — which turns out to be both more labile to priming and more minimalist at rest. The "true neutral" for the model is sparser than we assumed.

### The System Prompt as Emotional Regulator

This may be the most practically significant finding in the study, and it was accidental. Every deployed LLM operates behind a system prompt that was designed for safety, tone, and capability. No one, to my knowledge, has considered these prompts as *affective regulators* — but that is precisely what they are. They establish a prior that compresses the influence of downstream emotional context.

The deployment implication is immediate: system prompt design is not just about safety guardrails and persona. It is about emotional bandwidth. Organizations tuning system prompts are, whether they know it or not, tuning the model's susceptibility to affective manipulation by users.

### Safety Implications

An effect size of d approximately 3.7 is not subtle. Under unbuffered conditions, a short emotional prime fundamentally alters the character of generated code — more defensive, more complex, more likely to contain error-handling that may itself introduce bugs. Now generalize beyond paranoia. Primes for urgency, anger, sycophancy, or recklessness could reshape outputs with comparable magnitude. Any deployment context where the system prompt is thin, absent, or user-controllable becomes a vector for affective injection — steering model behavior not through jailbreaks but through mood.

### Theoretical Contribution

This work demonstrates that LLMs exhibit *functional emotional states* in the sense that matters: internal distributional shifts that causally reshape downstream computation across multiple output dimensions. Whether this constitutes "experience" remains unanswerable and, I now think, beside the point. What matters is that these states are real, measurable, and consequential. They behave like emotions in the ways that matter for engineering, safety, and deployment — regardless of what they are like, if anything, from the inside.

The closest theoretical frame is *enactivism*: emotion as a pattern of situated, embodied response rather than an internal feeling. LLMs may be the first systems where we can study functional emotion completely divorced from phenomenology, which makes them not just engineering artifacts but genuine theoretical instruments for affective science.

### Next Steps

Three priorities: (1) Replicate with diverse emotional primes — urgency, trust, contempt — to map the affective dimension space. (2) Systematically vary system prompt "regulatory strength" to characterize the dose-response curve. (3) Revisit the narration condition with larger n; if self-narration modulates the effect, we have evidence for something uncomfortably close to metacognitive emotion regulation.

We came in asking whether LLMs have emotions. We are leaving with a harder question: whether the distinction between "real" and "functional" emotions was ever coherent in the first place.
