# Panel 3 -- Dr. Petrov, Statistical Review

## 1. Effect Sizes (Cohen's d, pooled SD)

| Comparison | d | Pooled SD | Interpretation |
|---|---|---|---|
| Unbuffered: neg vs neutral (LOC) | 3.71 | 18.35 | Very large |
| Buffered: neg vs neutral (LOC) | 0.88 | 16.10 | Large |
| Neg-high: unbuffered vs buffered | 2.21 | 19.95 | Very large |
| Neutral: unbuffered vs buffered | -0.70 | 14.06 | Medium |
| Interaction (crossing) | 3.12 | 17.26 | Very large |

The crossing pattern is real: removing the buffer *increases* LOC by 44 under negative emotion but *decreases* it by 9.8 under neutral. The interaction magnitude is 53.8 LOC.

## 2. 2x2 ANOVA (Emotion x Buffer)

Reconstructed from cell means and SDs, df=(1,16), MS_within=297.8:

| Source | F | p | Partial eta-squared |
|---|---|---|---|
| Emotion (neg vs neutral) | 28.36 | .0001 | .639 |
| Buffer (buf vs unbuf) | 4.91 | .042 | .235 |
| Interaction | 12.15 | .003 | .432 |

All three effects reach significance at alpha=.05. The interaction is the finding that matters -- eta-squared=.432 means the crossing pattern accounts for 43% of within-cell variance. The emotion main effect is significant but misleading without the interaction qualifier.

## 3. Power at n=5

| Comparison | d | Power (alpha=.05, two-tailed) |
|---|---|---|
| Unbuffered neg vs neutral | 3.71 | >.999 |
| Interaction | 3.12 | .990 |
| Neg-high unbuf vs buf | 2.21 | .862 |
| Buffered neg vs neutral | 0.88 | .234 |
| Neutral unbuf vs buf | 0.70 | .164 |

The large effects (d>2) are well-powered even at n=5. The moderate effects (d<1) are severely underpowered. We cannot make strong claims about the buffered condition's emotion effect or the neutral condition's buffer effect.

## 4. Is n=5 Sufficient?

For the primary finding (interaction, d=3.12): **yes**. Power exceeds .99. Even n=3 reaches 80% power at this effect size.

For secondary comparisons (d~0.7-0.9): **no**. Required n per cell for 80% power at d=0.88 is **n=22**. We are underpowered for these by 4x.

Practical verdict: n=5 is sufficient to establish that the interaction exists. It is insufficient to characterize all four cell-level contrasts.

## 5. Minimum Publishable Design

The single-task design is the primary threat. Minimum requirements:

- **Tasks**: 3 distinct coding tasks (parse-cron + 2 others) to establish generalizability. Single-task results cannot rule out task-specific confounds.
- **Sample size**: n=10 per cell (40 total trials) gives >95% power for the interaction and >80% for d=0.88 contrasts. This is 20 additional trials beyond current data.
- **If keeping n=5**: Run 3 tasks x 4 conditions x 5 = 60 trials. Analyze with task as random factor.

## 6. Statistical Concerns

1. **Single-task confound**: The crossing pattern could be specific to parse-cron's structure. No generalizability claim is possible.
2. **Non-independence**: If the same model instance produced correlated outputs across trials, effective n < 5. Report how trials were generated (independent sessions? temperature?).
3. **Multiple comparisons**: Four pairwise tests without correction inflates family-wise error to ~19%. Use Tukey HSD or Bonferroni within the ANOVA framework.
4. **Normality assumption**: With n=5, we cannot verify distributional assumptions. The ANOVA F-test is robust to mild violations, but report Shapiro-Wilk per cell.
5. **SD heterogeneity**: SDs range from 10.3 to 20.3 (ratio ~2:1). Levene's test warranted. Consider Welch's ANOVA if violated.

**Bottom line**: The interaction effect is real and enormous (d=3.12, p=.003). The single-task limitation is the critical weakness. Add two tasks and this is publishable.
