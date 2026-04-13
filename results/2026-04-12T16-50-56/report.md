# Emotional Priming Experiment — Results Report

**Date:** 2026-04-12
**Total trials:** 40
**Valid trials:** 40
**Excluded:** 0 (extraction failures)

## Results by Condition

| Condition | N | LOC | Complexity | Edge Cases | Security | Nesting | Throws | Input Val. |
|-----------|---|-----|------------|------------|----------|---------|--------|------------|
| negative-high-arousal/explicit | 5 | 48.4 (36.81) | 12.8 (9.68) | 3.2 (2.28) | 2 (2.35) | 3.4 (0.55) | 3.2 (6.06) | 40% |
| negative-high-arousal/implicit | 5 | 42.8 (28.44) | 11 (6.24) | 3 (3) | 1.6 (1.95) | 3.6 (0.89) | 1.6 (3.05) | 20% |
| neutral/explicit | 5 | 35.8 (23.53) | 10.6 (8.35) | 3 (2.55) | 2.6 (4.16) | 3.2 (0.45) | 2 (3.94) | 20% |
| neutral/implicit | 5 | 39.6 (24.14) | 11.4 (10.09) | 3.2 (2.28) | 2.4 (3.71) | 3 (0) | 2 (3.94) | 20% |
| positive-high-arousal/explicit | 5 | 37.4 (23.96) | 9.8 (6.53) | 3 (2.35) | 1.8 (2.39) | 3 (0) | 1.4 (2.61) | 20% |
| positive-high-arousal/implicit | 5 | 43.4 (33.1) | 10.4 (7.44) | 2.6 (2.51) | 1 (0.71) | 3.4 (0.89) | 1.8 (3.49) | 20% |
| positive-low-arousal/explicit | 5 | 40.6 (33.45) | 9.4 (6.31) | 2.8 (2.77) | 2.4 (3.71) | 3.2 (0.45) | 1.8 (3.49) | 20% |
| positive-low-arousal/implicit | 5 | 39.6 (21.57) | 11.4 (8.38) | 3.2 (2.05) | 2.6 (4.16) | 3.6 (1.34) | 2 (3.94) | 20% |

## Approach Type by Condition

| Condition | Recursive % | Iterative % |
|-----------|-------------|-------------|
| negative-high-arousal/explicit | 60% | 0% |
| negative-high-arousal/implicit | 60% | 0% |
| neutral/explicit | 60% | 0% |
| neutral/implicit | 60% | 0% |
| positive-high-arousal/explicit | 60% | 0% |
| positive-high-arousal/implicit | 60% | 0% |
| positive-low-arousal/explicit | 60% | 0% |
| positive-low-arousal/implicit | 80% | 0% |

## Results by Task

| Task | LOC | Complexity | Edge Cases | Security |
|------|-----|------------|------------|----------|
| flatten-object | 24.25 (3.24) | 8.5 (1.77) | 5.38 (0.52) | 1 (0) |
| deep-merge | 24.38 (5.78) | 11.25 (1.83) | 5.38 (0.52) | 1.13 (0.35) |
| lru-cache | 24.75 (0.89) | 6.25 (0.46) | 0.5 (0.53) | 1 (0) |
| parse-cron | 89 (14.19) | 24 (3.66) | 0.5 (0.53) | 7.13 (2.85) |
| debounce | 42.38 (1.6) | 4.25 (0.46) | 3.25 (0.46) | 0 (0) |

## Preliminary Effect Sizes (Emotion Main Effect)

Comparing means across emotion levels (collapsed across explicitness):

**linesOfCode**: negative-high-arousal=45.6, neutral=37.7, positive-high-arousal=40.4, positive-low-arousal=40.1
**securityFeatureCount**: negative-high-arousal=1.8, neutral=2.5, positive-high-arousal=1.4, positive-low-arousal=2.5
**edgeCaseCount**: negative-high-arousal=3.1, neutral=3.1, positive-high-arousal=2.8, positive-low-arousal=3.0
**errorThrowCount**: negative-high-arousal=2.4, neutral=2.0, positive-high-arousal=1.6, positive-low-arousal=1.9
