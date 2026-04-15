<p align="center">
  <img src="hero.webp" alt="Three robots of different sizes responding differently to emotional priming" width="600" />
</p>

# claude-temper

Research-backed emotional modes for AI-assisted coding. 2,900+ trials across 42 experiments on Claude Haiku, Sonnet, and Opus.

**Key finding:** Emotional framing produces measurably different code than explicit instruction. Threat-relevant language increases input validation from 20% to 75% (n=75, p<.001). The effect is model-specific (Sonnet responds, Haiku doesn't, Opus changes structure but not decisions), scales with thinking depth, and gets neutralized by output-compression tools like caveman.

**Read the research:** [Post 1](https://dafmulder.substack.com/p/i-ran-1950-experiments-to-find-out) | [Post 2](https://dafmulder.substack.com/p/which-claude-is-most-emotionally-steerable)

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/a14a-org/claude-temper/main/install.sh | bash
```

Installs 5 standalone slash commands and a detection system:

| Mode | Frame | Best for |
|------|-------|----------|
| `/paranoid` | Threat vigilance | Security reviews, auth code, production deploys |
| `/creative` | Exploration | Prototyping, architecture, brainstorming |
| `/steady` | Methodical focus | Refactoring, debugging, code review |
| `/minimal` | Economy | Scripts, utilities, quick tasks |
| `/fresh-eyes` | Questioning | Reviewing unfamiliar code |

Plus `/temper detect [file]` to analyze code for behavioral signatures and `/temper stance` to check the active mode.

### Model notes

- **Sonnet:** strongest effect. +18pp validation lift, d=0.59-0.68 on security metrics. Pair with high or max effort.
- **Opus:** structural effect only. Writes more code with more security features, but doesn't change validation decisions.
- **Haiku:** no measurable effect. Use explicit instruction instead.

### Live status bar (experimental)

```bash
curl -fsSL https://raw.githubusercontent.com/a14a-org/claude-temper/main/install.sh | bash -s -- --with-statusbar
```

Shows detected stance, self-report alignment, and drift warnings. Paranoid detection ~80% accurate; other modes less reliable from code metrics alone.

### Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/a14a-org/claude-temper/main/install.sh | bash -s -- --uninstall
```

## Research findings

Based on 2,900+ trials across 42 experiments on Claude Haiku 4.5, Sonnet 4.6, and Opus 4.6.

### Core effects
1. **Emotional priming works** — threat-relevant language increases input validation from 20% to 75% (n=75, p<.001)
2. **Emotion + instruction are super-additive** — combined: 94% vs 69% (instruction) or 81% (emotion) alone
3. **Expression suppression doesn't eliminate behavior** — d=0.01 between expressed and suppressed paranoia
4. **Cross-domain transfer** — paranoia doubles defensiveness even on math/CSV tasks (d=1.97)

### Model and effort interactions
5. **Model-specific** — Sonnet responds behaviorally (+18pp), Opus responds structurally (d=0.49 LOC, d=0.50 security), Haiku is immune
6. **Effort amplifies priming** — d=0.32 (low) → 0.41 (high) → 0.44 (max). More thinking = stronger effect
7. **System prompts dampen the effect** — 4x reduction when prime is appended to a 14k-token system prompt (p=.003)

### Boundaries
8. **Asymmetric response** — excitement/urgency does not reduce security below baseline (d<0.1, n=325). You can steer up, not down.
9. **Destructive tasks unaffected** — priming doesn't change refactoring or code removal decisions (d=0.00-0.04, n=135)
10. **Output compression kills the effect** — caveman mode neutralizes paranoid priming (62% → 35%, p=.030). "Only fluff die" reclassifies defensive scaffolding as fluff.

Grounded in Anthropic's [Emotion Concepts in Claude](https://www.anthropic.com/research/emotion-concepts-function) (2025).

## Reproduce

```bash
bun install

# Core experiments
bun run src/orchestrator.ts               # 725 trials (original batch)
bun run src/orchestrator-post2.ts         # 475 trials (exploit, burnout, destructive)
bun run src/orchestrator-model-effort.ts  # 270 trials (Haiku, Sonnet, Opus × effort)

# Caveman interaction
bun run src/exp-caveman-v2.ts             # 132 trials (caveman × paranoid)
bun run src/exp-caveman-baseline.ts       # 100 trials (caveman vs normal)

# Individual experiments
bun run src/exp-replication.ts            # 225 trials (core finding)
bun run src/exp-multi-emotion.ts          # 120 trials (emotion map)
bun run src/exp-exploit-v2.ts             # 180 trials (excitement on auth tasks)
bun run src/exp-model-effort.ts sonnet    # 90 trials (single model)
```

Results are NDJSON in `results/`.

## Project structure

```
claude-temper/
├── skill/                    # Installable Claude Code skill
│   ├── SKILL.md             # Main skill (detect + stance)
│   ├── modes/               # Individual mode skills
│   │   ├── paranoid/
│   │   ├── creative/
│   │   ├── steady/
│   │   ├── minimal/
│   │   └── fresh-eyes/
│   ├── hooks/               # PostToolUse + Stop hooks
│   └── status/              # Status line script
├── src/                      # Experiment infrastructure
│   ├── experiment-runner.ts  # Shared trial runner
│   ├── metrics.ts            # 14 automated code metrics
│   └── exp-*.ts              # Individual experiments
├── results/                  # All experiment NDJSON data
├── whitepaper.tex / .pdf     # Research whitepaper
├── onepager.tex / .pdf       # One-pager
├── install.sh                # One-line installer
├── substack-draft.md         # Post 1
└── substack-post2-draft.md   # Post 2
```

## License

MIT
