# Joint Proposal: Emotion Detection from Code Output

**Panel**: Chen (cognitive psychology), Okafor (computational linguistics), Petrov (statistics), Yamamoto (cognitive science), Santos (HCI), Park (mechanistic interpretability)
**Date**: April 2026 | **Basis**: 1,250 trials across 17 experiments

---

## 1. Discriminative Features (Okafor)

Our existing metrics already separate conditions clearly -- paranoia produces 90% input validation vs 33% for calm/detachment, and LOC ranges from 83 (paranoia) to 51 (excitement). But we are leaving signal on the table. New features to extract:

- **Defensive depth**: Not just whether validation exists, but where. Paranoia validates at function entry AND before each use. Excitement validates once or not at all.
- **Error message specificity**: Paranoid code throws `new TypeError("Expected non-empty string for userId")`. Detached code throws `new Error("invalid input")`. Character count and parameter naming in error messages are cheap, high-signal features.
- **Guard clause density**: Number of early returns in the first 30% of a function body. Paranoia front-loads guards; excitement defers to happy path.
- **Redundant safety**: Does the code check the same condition twice in different ways? (`if (!x) return` followed by `x = x ?? default`). This is a paranoia-specific pattern absent from all other states.
- **Comment tone**: When comments exist (rare, but non-zero), paranoid code comments reference what could go wrong ("// prevent prototype pollution"). Excited code comments reference what it does ("// elegant recursive merge").
- **Naming defensiveness**: Variables named `sanitizedInput`, `safeValue`, `validatedConfig` vs `result`, `output`, `data`.

## 2. Unique vs Shared Signatures (Park)

From the multi-emotion experiment (n=30/cell), three features discriminate uniquely:

| Feature | Paranoia | Excitement | Calm | Detachment | Desperation* |
|---------|----------|------------|------|------------|-------------|
| Input validation >80% | YES | no | no | no | no |
| Security features >5 | YES | no | no | no | no |
| LOC < 40 with zero throws | no | YES | partial | YES | YES |
| Throws > 0 AND security = 0 | no | no | no | no | YES* |

*Desperation predicted from Anthropic's vector research -- not yet empirically validated in our dataset.

The key discriminator: paranoia is the only state that produces BOTH high LOC AND high validation. Excitement produces low LOC with moderate validation. Desperation should produce low LOC with zero validation -- active corner-cutting. Calm and detachment overlap heavily and may require second-order features (error message specificity, naming patterns) to separate.

## 3. Experimental Design (Petrov)

**Classifier validation requires labeled data we already have.** From our 1,250 trials, approximately 500 have clear emotion labels (multi-emotion experiment: 120, replication: 225, combo-extended: 108, plus scattered others). The remaining trials use compound conditions (emotion+instruction) or natural induction (weak effects) and should be excluded from training.

**Design:**
- Training set: 70% of labeled single-emotion trials (~350 examples across 4-5 states)
- Test set: 30% held out (~150 examples), stratified by emotion AND task
- Validation: 5-fold cross-validation on training set for hyperparameter selection
- Critical: stratify by TASK, not just emotion. Task explains more variance than emotion in our data (parse-cron alone accounts for most LOC variance).

**Accuracy thresholds:**
- Chance (5-class): 20%. Chance (binary paranoid/not): 50%.
- Minimum useful (5-class): 55% -- nearly 3x chance, sufficient for research instrument
- Practically deployable: 75%+ on the binary paranoid/not-paranoid detector
- Gold standard: 70%+ on 5-class -- this would be a publishable result on its own

**Sample size**: 350 training examples is tight for a 5-class problem with 13+ features. We should start with the binary classifier (paranoid vs everything else) where we have strong separation, then attempt multi-class only if binary succeeds.

## 4. Emotional State vs Behavioral Policy (Chen)

The distinction matters theoretically but not practically. Our misattribution data (d=-1.72 collapse to neutral) confirmed H2: the model responds to semantic threat cues, not internal affect. So what we are detecting is better described as "active behavioral policy" than "emotional state." A paranoid policy produces defensive code regardless of whether anything resembling paranoia exists internally.

For a detection system, this is actually good news. Behavioral policies produce more consistent, more detectable signatures than genuine emotions would. Real emotions are noisy, variable, context-dependent. Policy activation is closer to a binary switch with predictable outputs. We should name the system accordingly: "behavioral stance detector," not "emotion detector."

## 5. Self-Detection (Yamamoto)

Self-report will not work. Anthropic's research shows emotion vectors operate invisibly -- the model's self-model does not reliably track its own functional state. Asking Claude "are you in a paranoid state?" measures metacognitive access to the active policy, which is a different variable than the policy itself. Our expression suppression finding (d=0.01 between expressed and suppressed paranoia) confirms this: the model can suppress visible markers while the behavioral signature persists unchanged.

A behavioral approach -- feeding the model's own code output back through the classifier -- would measure the actual policy rather than self-reported state. This is analogous to measuring heart rate instead of asking "are you anxious?" Both are valid but they measure different things.

## 6. UX Design (Santos)

Three tiers, increasing in ambition:

1. **Developer dashboard** (immediate): Show a simple stance indicator after each code generation -- "This response shows elevated defensive patterns consistent with threat-vigilant processing." No remediation, just awareness. Useful for researchers and power users.

2. **Mode verification** (medium-term): When a user activates `/paranoid` mode, the detector confirms it is working: "Paranoid mode active -- defensive metrics elevated 2.3x above your session baseline." This closes the loop on whether modes actually do what they claim.

3. **Drift detection** (long-term): Monitor stance across a conversation. If the user's frustrated debugging messages inadvertently push the model toward corner-cutting (desperation pattern), surface a warning: "Code quality metrics have declined over the last 3 responses. Consider resetting context." This is the safety application -- detecting adversarial or accidental emotional manipulation.

The creepiness boundary: never say "you seem frustrated" or "Claude is feeling anxious." Always frame as behavioral metrics: "defensive pattern density is above/below typical range."

## 7. Proposed Experiments

**Experiment A: Binary classifier feasibility (50 trials).** Build a logistic regression on {LOC, security features, throws, input validation, nesting depth} using our existing labeled data. Test on 50 NEW paranoia vs neutral trials (25 each). Target: 80% accuracy on this easy binary.

**Experiment B: Feature expansion (0 new trials).** Add the new features (error message specificity, guard clause density, naming defensiveness) to our existing 500 labeled examples. Compare classifier accuracy before and after. If accuracy jumps >10%, the new features carry real signal.

**Experiment C: Blind classification (100 trials).** Generate 100 code samples under randomly assigned emotions (5 states x 20 trials). Strip all metadata. Have the classifier predict. Have three human raters predict. Compare classifier vs human accuracy. If the classifier beats humans, behavioral metrics outperform intuition.

**Experiment D: Mode verification loop (50 trials).** Activate each proposed mode (/paranoid, /creative, /steady, /minimal, /fresh-eyes) for 10 trials each. Run the detector. Does each mode produce its expected signature at least 80% of the time? This validates both the modes and the detector simultaneously.

**Experiment E: Conversation drift (20 multi-turn sessions).** Run 20 extended coding sessions where a simulated user gradually introduces frustrated/desperate language over 5-10 turns. Track whether the detector identifies the drift point where code quality metrics shift.

## 8. Heuristic vs Trained Classifier

Start with heuristics. Our data already gives us decision boundaries:
- Input validation > 80% AND security > 5 --> paranoia (precision ~90% in our dataset)
- LOC < 45 AND throws = 0 AND security < 2 --> excitement or detachment
- LOC > 100 AND validation > 60% --> combined emotion+instruction mode

These rules are interpretable, auditable, and require no training infrastructure. Build the heuristic system first, measure its accuracy on held-out data, and only move to a trained classifier if heuristics plateau below 65% on 5-class.

If we do train: random forest over logistic regression. Our features have non-linear interactions (high LOC + high validation = paranoia, but high LOC + low validation = instruction-only). Trees handle this naturally.

## 9. Connection to Modes

The detection system is the verification layer for the proposed `/paranoid`, `/creative`, `/steady`, `/minimal`, `/fresh-eyes` modes. Without detection, modes are unverifiable claims. With detection, every mode activation can be confirmed: "Mode activated. Behavioral signature detected in output. Mode is working." This transforms modes from prompt engineering tricks into measurable, auditable tools.

---

*Endorsed by the full panel. Total new trials proposed: ~270. Estimated cost: ~4 hours of API time. Priority order: A, D, B, C, E.*
