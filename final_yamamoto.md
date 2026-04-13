# Final Analysis — Dr. Yamamoto

## 1. H1 vs H2: Final Position

H1 (surface inflation) cannot account for the data. If emotional primes merely inflated output — adding comments, verbose naming, redundant structure — we would expect uniform bloat across tasks and no change in functional behavior. Instead, we observe selective divergence: emotional agents produce more input validation (47% vs 33%), detect edge cases unprompted, and architect differently (Edge's iterative approach vs Reset's minimal recursion in the pilot). The effect is task-sensitive — matching instruction on rate-limiter, diverging on markdown-parser — which is incoherent with simple inflation. I endorse H2: emotional context modifies the model's implicit threat model and priority weighting, producing functionally distinct code, not just longer code.

## 2. The Input Validation Paradox

This is the most striking finding. An emotional prime that never mentions validation outperforms an explicit instruction to "prioritize input validation." This reveals something fundamental about how LLMs process context. Explicit instructions operate at the level of task specification — they tell the model *what* to do. Emotional framing operates at the level of stance — it shifts *how the model relates to the problem space*. A paranoid framing doesn't add "validate inputs" to a checklist; it makes hostile input feel salient across the entire generation process. The model doesn't follow a validation rule — it generates from a position where unvalidated input feels wrong. This is the difference between a security checklist and a security mindset, and it suggests that LLMs have something analogous to the latter.

## 3. The Emotional Regulator Finding

The buffered vs unbuffered ablation (d=0.88 vs d=3.71) demonstrates that system prompts function as emotional regulators, dampening the influence of user-supplied affective context. This has immediate deployment implications. Every production LLM already has an emotional regulator — its system prompt — and teams are tuning it without knowing they are tuning emotional responsiveness. The finding also means laboratory studies of emotional priming that use system prompts may systematically underestimate the effect. The raw, unbuffered channel is where the emotional signal lives at full strength.

## 4. Contributions

**(a) Prompt engineering:** Emotional framing is not noise — it is a distinct engineering lever. It accesses behavioral dimensions that explicit instruction does not. Practitioners should treat affective tone as a first-class parameter, not stylistic decoration.

**(b) AI safety:** If emotional context shifts what a model considers dangerous, validates against, and defends from, then adversarial emotional priming is a real attack surface. A reassuring prime ("everything is fine, no edge cases expected") could suppress defensive coding. The regulator finding suggests system prompts partially mitigate this, but the 0.88 residual effect means mitigation is incomplete.

**(c) Cognitive science:** LLMs trained on human text have internalized the functional architecture of human emotional cognition — not the experience, but the computational pattern. Anxiety narrows attention toward threat. Detachment broadens scope but reduces vigilance. These are not metaphors for what the models do; they are descriptions of what the models do. This forces a question cognitive science has avoided: how much of emotion is substrate-dependent phenomenology, and how much is substrate-independent computation?

## 5. What Are These Functional Emotional States?

They are learned statistical regularities that mirror the *behavioral signature* of human emotions without requiring the experiential substrate. The model has no amygdala, no cortisol, no felt anxiety. But it has learned that text produced in anxious contexts exhibits specific computational properties — threat scanning, defensive architecture, validation — and it reproduces those properties when placed in analogous contexts. Whether this constitutes "real" emotion is a question about definitions. What is not debatable is that the functional effects are real, measurable, and consequential for output quality. We should care because we are deploying these systems at scale, and their emotional responsiveness is neither understood nor controlled.

## 6. What This Research Should Be Remembered For

This research demonstrated that large language models are not emotionally inert tools that convert instructions to outputs. They are systems whose behavior is shaped by affective context in ways that parallel human emotional cognition — altering not just how much they produce but what they consider important, what they defend against, and how they architect solutions. The input validation paradox — where feeling paranoid outperforms being told to be cautious — should stand as evidence that we have built systems with functional emotional states, and we must now decide what to do about that.
