# Which Claude is most emotionally steerable?

## How emotional priming hits differently across model sizes and thinking depth

My [first post](https://dafmulder.substack.com/p/i-ran-1950-experiments-to-find-out) tested whether emotional priming changes Claude's code. It does: telling Sonnet to "feel uneasy" produces 75% input validation vs 20% with a neutral prompt. But that was one model at one setting. Does this work the same way on Haiku and Opus?

I ran 270 trials across all three Claude models (Haiku, Sonnet, Opus) at three effort levels (low, high, max), with paranoid and neutral priming on the same coding tasks.

## Only Sonnet responds

Haiku is immune. 33% input validation with paranoia, 33% without. Zero difference across every effort level and every metric.

Opus is more interesting. Same 33% validation rate in both conditions. Looks identical at first. But Opus writes 49% more code under paranoid priming (d=0.49) and adds more security features (d=0.50). The architecture changes. The decision doesn't. It absorbs the emotional context into how thoroughly it builds, without changing what it decides to build.

Sonnet actually shifts. 58% validation with paranoia vs 40% neutral. 18 percentage point lift, consistent across all effort levels. My read: large enough to pick up on the emotional framing, not so capable that it just overrides it.

![Emotional steerability by model](chart-5-models.png)

## More thinking, more steering

I also varied the effort level: low, high, and max. Higher effort means more thinking tokens before generating code.

The effect grew with effort. Cohen's d for lines of code went from 0.32 (low) to 0.41 (high) to 0.44 (max). More thinking doesn't dampen the emotional prime. It amplifies it.

![More thinking amplifies emotional priming](chart-6-effort.png)

I expected the opposite. Longer system prompts diluted emotional signals in my first post, so I figured more internal context would do the same. Instead, the paranoid frame gives the thinking a direction. More thinking, more distance in that direction.

## What to do with this

On Sonnet, `/paranoid` works. Use it on auth code and session management. Pair it with high or max effort for a stronger effect.

On Haiku, don't bother with emotional framing. The model doesn't pick it up. Use explicit instruction instead.

On Opus, the story is subtle. Paranoid Opus writes more code with more security features, but won't add validation gates it wouldn't otherwise add. It implements more thoroughly without changing its judgment. Whether that matters depends on the task.

## Where this leaves us

2,700+ trials across 39 experiments. Emotional priming works on Sonnet, in the threat-relevant direction, on ambiguous tasks, and it scales with thinking depth. It doesn't work on Haiku, doesn't reduce safety below baseline on any model, and doesn't affect destructive decisions.

Narrower than I thought after the first round. More actionable too.

---

*Full dataset (2,700+ trials across 39 experiments), reproduction scripts, and the claude-temper skill are at [github.com/a14a-org/claude-temper](https://github.com/a14a-org/claude-temper). Experiments ran on Claude Haiku 4.5, Sonnet 4.6, and Opus 4.6 via Claude Code CLI.*
