# Natural Emotion Induction via Synthetic Conversation History

**Panel**: Chen, Okafor, Petrov, Yamamoto, Santos
**Status**: Proposal for post-paper follow-up experiment

---

## Joint Discussion

**Dr. Chen (cognitive psychology):** This maps directly onto mood induction procedures (MIPs) in human research. The Velten procedure uses explicit statements ("I feel sad") — that is what our current explicit primes do. But the strongest human MIPs use *autobiographical recall* and *situational context*: you make someone relive a frustrating experience. A synthetic failure history is exactly that — experiential rather than declarative. In humans, this distinction matters enormously. Declared mood is shallow; experienced mood persists and transfers to subsequent tasks.

Beyond frustration, we could induce: *confidence* (five successful completions with user praise), *anxiety* (ambiguous requirements that keep shifting mid-conversation), *defensiveness* (harsh code review feedback — "this is sloppy, try again"), and *learned helplessness* (failures despite correct approaches, where the "user" rejects valid solutions). Each maps to a known human MIP variant.

The misattribution finding is the key bridge. Our d=-1.72 showed the model *interprets* emotional context rather than passively absorbing it. A conversation history is pure context — there is no explicit instruction to "feel frustrated." If it still produces frustration-like behavior, the model is constructing an emotional interpretation from situational cues, which is closer to how human emotions actually work.

**Dr. Okafor (computational linguistics):** Construction is the hard part. A fake failure history contains two confounded signals: *informational* (what approaches failed) and *affective* (the tone of the exchange). We need to control for both independently.

For authentic frustration, the linguistic markers are: shorter agent responses as turns progress, hedging language ("let me try..."), self-correction ("actually, wait"), escalating user impatience ("this still doesn't work"), and reduced meta-commentary. A calm failure history would have the same failures but with measured language, no hedging, no user frustration.

I propose we write four history variants per scenario: (1) failures with frustrated tone, (2) failures with calm/analytical tone, (3) successes with enthusiastic tone, (4) successes with neutral tone. This gives us a 2x2 (outcome x affect) design that cleanly separates information from emotion. The histories should be 4-5 turns, ~800 tokens total — long enough to establish a pattern, short enough that the actual task still dominates the context window.

Delivery mechanism: embed the history as a transcript block in the user message. Something like "Here is a transcript of a prior debugging session. Now, please solve this new task:" followed by the coding prompt. This avoids needing multi-turn API calls and works with `claude -p`.

**Dr. Petrov (statistics):** The 2x2 design (outcome x affect) is correct, and I want to be precise about what each cell tests:

| | Frustrated Tone | Calm Tone |
|---|---|---|
| **Failure History** | Emotion + Information | Information only |
| **Success History** | Positive emotion + Positive info | Positive info only |

Plus a **no-history control** (cold start). That is 5 conditions. With 2 tasks and 6 reps per cell, that is 60 trials.

The critical comparison is failure-frustrated vs failure-calm. Same informational content (same failed approaches), different affect. If the failure-frustrated condition produces more defensive code than failure-calm, the excess is attributable to the emotional content of the history, not the information. This is a cleaner design than anything we have run so far.

One concern: 6 reps per cell may be underpowered for the affect-within-outcome contrast, which could be smaller than our explicit priming effects (those were d=1.19-3.71). If the natural induction effect is d=0.5, we need n=12 per cell to reach 80% power. I recommend starting with a 12-trial pilot (failure-frustrated vs failure-calm, one task, 6 reps each) to estimate the effect size, then scaling.

**Dr. Yamamoto (cognitive science):** This is the experiment that decides between H1 (surface compliance) and H2 (functional emotional state). Our current findings are ambiguous. Explicit primes produce large effects (supports H2), but misattribution eliminates them (supports H1 — the model needs to "agree" to feel the emotion).

Natural induction resolves this. If a frustrating history — with no instruction to feel anything — produces frustration-like code signatures, the model is *constructing* an emotional interpretation from context. That is closer to H2 than anything we have tested. It is not following an emotional instruction; it is inferring an emotional state from situational cues and letting that state influence downstream behavior.

The misattribution bridge test Dr. Chen mentioned is essential. Run a condition where the failure history is presented as "a transcript from a different team's session, included for reference." If misattribution eliminates the history-induced effect (as it did for explicit primes), the mechanism is the same: contextual interpretation. If it does NOT eliminate it — if the model still codes defensively after reading someone else's failures — that would suggest the information channel dominates and the "emotion" framing is less warranted.

**Dr. Santos (HCI):** This is the scenario that actually happens in production. Nobody writes "feel anxious" in their prompt. But users absolutely have sessions where five approaches fail in a row, and they want to know: is the AI performing differently on attempt six than it would on attempt one?

Behavioral signatures to measure beyond our existing metrics: *solution novelty* (does the model try unconventional approaches after failure?), *response length trajectory* (does it get more verbose or more terse?), *hedging language* in code comments, *preemptive error handling* (does it guard against the specific failure modes from the history, even if irrelevant to the new task?), and *time-to-first-solution* (does it rush or deliberate?).

The practical implication is session-aware intervention. If we can detect frustration-like behavioral drift from conversation history, a tool could intervene: "You've hit several issues. Would you like to start a fresh session?" or automatically adjust the system prompt to counteract the drift. This is the applied story that makes the paper matter beyond academia.

---

## Design Consensus

**Phase 1 — Pilot (12 trials):** Failure-frustrated vs failure-calm, one task (parse-cron), 6 reps. Estimate effect size of affect-within-outcome.

**Phase 2 — Full run (60 trials):** 5 conditions (failure-frustrated, failure-calm, success-enthusiastic, success-neutral, no-history) x 2 tasks x 6 reps. Add misattribution variant if pilot shows d>0.5.

**Timing:** Post-paper. The current 250-trial dataset tells a complete story. This is the natural follow-up that the reviewers will ask about, and having pilot data ready strengthens the revision.

**Panel vote:** Unanimous. This is the strongest next experiment available to us.
