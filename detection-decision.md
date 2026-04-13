# Detection Classifier Decision

**Decision: Option A -- Reduce to 3-class (paranoid / active / baseline)**

**Date:** 2026-04-12
**Decided by:** Dr. Petrov (statistical review)

## Rationale

The 5-class classifier scores 26.7% (chance = 20%). That is not a classifier. It is noise with a label. The confusion matrix confirms creative, steady, neutral, and minimal collapse into each other. Further feature engineering will not fix this: the within-mode variance exceeds the between-mode distance for those four classes.

However, we do not have zero signal. Two things work:

1. **Binary paranoid detection operates at 67-80%.** Paranoid mode produces distinctive code artifacts: LOC=120, security checks=9.7, validation=100%. These are well-separated from all other modes.

2. **LOC cleanly separates activity levels.** Mode-verification data shows paranoid=120, steady=83, creative=40, minimal=30. A median split on LOC among non-paranoid samples gives a defensible "active" vs "baseline" boundary.

## Implementation

- **Class 1 -- Paranoid:** Classify using existing security/validation features. Threshold tuning on the binary classifier that already works.
- **Class 2 -- Active:** Non-paranoid, LOC > median. Captures steady-mode behavior and high-output creative responses.
- **Class 3 -- Baseline:** Non-paranoid, LOC <= median. Captures minimal and low-output modes.

## What we reject

- **Option B (2-class):** Discards real LOC signal. The verification data proves activity level is measurable. Reducing to binary is leaving information on the table.
- **Option C (explanation condition):** Changes the experimental paradigm from code-artifact classification to natural language classification. Scientifically valid but out of scope for the current methodology. Can be revisited as a follow-up study.

## Expected performance

- Paranoid detection: 67-80% (demonstrated)
- Active/baseline split: estimated 70-85% based on LOC separation in verification data
- Overall 3-class accuracy: estimated 65-75%, up from 26.7%

## Next steps

1. Retrain classifier with 3-class labels
2. Set LOC threshold from verification data median
3. Run 30-trial validation under 3-class scheme
4. Report updated confusion matrix
