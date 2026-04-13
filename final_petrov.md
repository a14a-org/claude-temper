# Final Statistical Analysis — Dr. Petrov

## 1. One-Way ANOVA (Collapsed, 3 conditions, N=45)

| Source  | SS        | df | MS       | F     | p      |
|---------|-----------|----|----------|-------|--------|
| Between | 53,725.3  | 2  | 26,862.7 | 9.305 | .0005  |
| Within  | 121,244.2 | 42 | 2,886.8  |       |        |

**eta-squared = .307** (large effect). The omnibus test is significant. Prompt condition accounts for ~31% of variance in LOC output.

## 2. Tukey HSD Pairwise Comparisons

| Pair                      | Mean Diff | q     | p      | Sig?           |
|---------------------------|-----------|-------|--------|----------------|
| Instruction vs Neutral    | 83.9      | 6.048 | .0003  | Yes            |
| Emotional vs Neutral      | 51.6      | 3.720 | .031   | Yes            |
| Instruction vs Emotional  | 32.3      | 2.328 | .238   | No             |

Instruction and Emotional both produce significantly more code than Neutral. They do not differ significantly from each other.

## 3. Problematic Cell: markdown-parser x Instruction (SD=123.8)

CV = 90%. All other cells: mean CV = 25%. This single cell contributes disproportionately to the Instruction condition's inflated SD (70.1 vs 46.5 and 39.8). Variance ratio across conditions = 3.10, which approaches but does not exceed the conventional 4:1 threshold for ANOVA robustness concern.

**Recommendation**: Report with and without. The ANOVA is robust to moderate heteroscedasticity at equal n, and results hold either way. But this cell likely contains one or more extreme observations (possibly a single trial producing 300+ LOC). Winsorizing or reporting a sensitivity analysis excluding this cell would strengthen the paper. Do not silently drop it.

## 4. Input Validation: Fisher's Exact Test

Emotional 47% (7/15) vs non-emotional 33% (10/30).

- Fisher's exact (2x2): OR = 1.75, **p = .517** (NS)
- Chi-square (3x2): chi-squared(2) = 0.756, **p = .685** (NS)

The 14 percentage-point difference is not significant. With n=15 per group, the test has very low power for detecting differences this small. Report as descriptive/exploratory only.

## 5. Power Analysis

| Parameter | Value |
|-----------|-------|
| Observed effect size f | 0.666 (large) |
| Power at observed effect | .978 |
| Min detectable f at 80% power | 0.480 (eta-squared = .187) |
| Pairwise power for d=0.54 (Emotional vs Instruction) | .298 |

The design is well-powered for the omnibus test and for large pairwise effects (d > 1.0). It is severely underpowered for the Emotional vs Instruction comparison (power = 30%). To detect d=0.54 at 80% power would require n=55 per group.

## 6. Verdict: Publication Readiness

**Publishable with caveats.** The core finding is real: both structured prompts (instruction and emotional) elicit substantially more code than neutral prompts (F(2,42)=9.31, p<.001, eta-squared=.31). The emotional vs instruction distinction is not supported by this sample size. The validation rate finding is underpowered noise. The markdown-parser variance issue requires transparent reporting.

This is a 45-trial pilot. It establishes the effect exists and estimates its magnitude. It does not have the resolution to distinguish emotional from instructional prompting, nor to make claims about qualitative behaviors like input validation. The prior ablation data (d=3.71 unbuffered, buffer interaction p=.003) suggests the emotional effect may be real but context-dependent. A confirmatory study with n=50+ per cell, pre-registered contrasts, and controlled output buffering is the next step.
