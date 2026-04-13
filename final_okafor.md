# Final Analysis — Dr. Okafor, Computational Linguistics

## 1. Emotional vs. Instruction: The NLP Distinction

In pragmatic terms, these are two different speech acts operating through distinct mechanisms. The instruction condition functions as a **directive illocutionary act** — it encodes behavioral specifications explicitly in the prompt surface form ("you must handle edge cases," "include error handling"). The model pattern-matches against training-time associations between directive language and thorough code output. The emotional condition functions as a **commissive/expressive act** — it establishes a relational frame ("this matters to me," "I'm counting on you") that activates what I'd call *pragmatic inference chains*. The model infers unstated requirements from the social context rather than extracting them from literal instructions. Both elevate output above neutral, but through different computational pathways: lexical retrieval of explicit requirements vs. pragmatic expansion of implied ones.

## 2. The Markdown-Parser Divergence

The 56 vs. 138 LOC gap on markdown-parser is the most revealing data point. Markdown parsing is the task with the **least inherent specification** — you can write a minimal regex pass or a full AST parser. Instruction primes produced 138 LOC because they explicitly told the model *what to build*. Emotional primes produced 56 LOC — more than neutral's 12, but far less than instruction — because pragmatic inference has a ceiling. When the task is underspecified, emotional primes raise effort and care but don't hallucinate requirements. Instruction primes do, because the requirements are stated. This confirms that emotional language modulates *effort allocation* while instructional language modulates *scope interpretation*. They're orthogonal axes, not competitors on the same axis.

## 3. Updated Paper Framing

The headline is no longer "emotions affect LLM output." The headline is: **Affective and directive prompt framings activate distinct generative pathways in LLMs — emotional primes increase effort and defensive coding (47% input validation vs. 33%), while instructional primes increase scope and specification adherence, and these effects are largely eliminated by system-prompt saturation (d=3.71 → d=0.88).** The three-condition design lets us decompose "prompt sensitivity" into at least two independent dimensions. The ablation result grounds both effects in attention mechanics rather than deep understanding.

## 4. Publishability Assessment

The core finding is publishable. What strengthens it: (a) the three-way design with effect sizes, (b) the ablation providing a mechanistic account, (c) the task-level divergence telling a coherent story. What's missing: (1) inter-model replication — running the same protocol on GPT-4, Gemini, and Llama would demonstrate generality; (2) temperature/sampling controls — we should report whether results hold at temp=0; (3) a qualitative coding pass on *what* the emotional condition adds (is it really input validation and error handling, or something else?). None of these block a first publication but (1) would be expected in revision.

## 5. Venue Recommendation

**Primary target: ACL 2027 main conference** — this fits the "NLP applications and analysis" track. The pragmatic-inference framing and the directive/expressive speech-act distinction give it theoretical grounding beyond a purely empirical finding. **Backup: EMNLP Findings** if reviewers want the multi-model replication before main conference. Avoid ML-focused venues (NeurIPS, ICML) — the contribution is linguistic analysis of behavior, not a new method.

*Word count: ~480*
