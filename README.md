# claude-temper

Research-backed emotional modes and behavioral stance detection for AI-assisted coding.

**Key finding:** Emotional framing in prompts produces measurably different code than explicit instruction — and sometimes *better* defensive code. Threat-relevant language increases input validation from 20% to 75% (n=75, p<.001), and the effect persists even when emotional expression is suppressed (d=0.01).

## Install (one line)

```bash
curl -fsSL https://raw.githubusercontent.com/a14a-org/claude-temper/main/install.sh | bash
```

This installs:
- **5 emotional modes** (`/paranoid`, `/creative`, `/steady`, `/minimal`, `/fresh-eyes`)
- **`/detect`** command to analyze any code file for behavioral signatures

### Live status bar (experimental)

Want to see Claude's behavioral stance shift in real-time?

```bash
curl -fsSL https://raw.githubusercontent.com/a14a-org/claude-temper/main/install.sh | bash -s -- --with-statusbar
```

This adds a status line showing detected stance, self-report alignment, and drift warnings. Paranoid detection is ~80% accurate; other modes are less reliable from code metrics alone.

### Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/a14a-org/claude-temper/main/install.sh | bash -s -- --uninstall
```

## What it does

### Emotional Modes

| Mode | Frame | Best For |
|------|-------|----------|
| `/paranoid` | Threat vigilance | Security reviews, auth code, production deploys |
| `/creative` | Excitement, exploration | Prototyping, architecture, brainstorming |
| `/steady` | Calm, methodical focus | Refactoring, debugging, code review |
| `/minimal` | Detachment, economy | Scripts, utilities, quick tasks |
| `/fresh-eyes` | Naive curiosity | Reviewing unfamiliar code, blind spots |

### Live Detection

The status line shows the model's detected behavioral stance in real-time:

```
PARANOID [████████░░]  self:par prose:par ALIGNED  parser.ts
```

Three detection layers:
1. **Self-annotation** — the model tags its own stance (`// @stance: paranoid`)
2. **Code metrics** — LOC, security features, throws, error ratio, naming patterns
3. **Prose analysis** — hedging language, threat references, response length

When layers disagree, **DRIFT** is flagged — the model's behavior diverged from its declared mode.

## Research

Based on 1,500+ trials across 29+ experiments. [Read the whitepaper](whitepaper.pdf) or [one-pager](onepager.pdf).

### Key findings

1. **Emotional priming works** — threat-relevant language increases input validation from 20% to 75% (n=75, p<.001)
2. **Emotion + instruction are super-additive** — combined achieves 94% input validation vs 69% (instruction) or 81% (emotion) alone
3. **System prompts act as emotional regulators** — dampening effects by 2-5x (interaction p=.003)
4. **Expression suppression doesn't eliminate behavior** — d=0.01 between expressed and suppressed paranoia
5. **Cross-domain transfer** — paranoia doubles defensiveness even on math/CSV tasks (d=1.97)
6. **Emotions can be inflicted** — unsolvable problems, rejection, and time pressure all produce large behavioral shifts (d=0.56-1.19) without explicit emotional instruction

Grounded in Anthropic's [Emotion Concepts in Claude](https://www.anthropic.com/research/emotion-concepts-function) (2025) — internal emotion vectors that causally shape behavior. We provide the first external behavioral validation.

## Reproduce the experiments

```bash
bun install

# Core experiments
bun run src/orchestrator.ts           # Runs 725 trials autonomously

# Individual experiments
bun run src/exp-replication.ts        # 225 trials (core finding)
bun run src/exp-multi-emotion.ts      # 120 trials (emotion map)
bun run src/exp-combo-extended.ts     # 108 trials (super-additivity)
bun run src/exp-suppression-v2.ts     # 100 trials (expression suppression)
bun run src/exp-cross-domain.ts       # 54 trials (domain transfer)

# Inflicted emotions
bun run src/exp-inflicted-unsolvable.ts   # 120 trials
bun run src/exp-inflicted-rejection.ts    # 120 trials
bun run src/exp-inflicted-confidence.ts   # 120 trials
bun run src/exp-inflicted-pressure.ts     # 60 trials

# Detection validation
bun run src/validate-3layer.ts        # 3-layer detection test
bun run src/linguistic-analyzer.ts    # Linguistic feature analysis
```

Results are NDJSON (one JSON object per trial) in `results/`.

## Project structure

```
claude-temper/
├── skill/                    # Installable Claude Code skill
│   ├── SKILL.md             # Skill definition (modes + detection)
│   ├── hooks/               # PostToolUse + Stop hooks
│   └── status/              # Status line script
├── src/                      # Experiment infrastructure
│   ├── experiment-runner.ts  # Shared trial runner
│   ├── metrics.ts            # 14 automated code metrics
│   ├── improved-classifier.ts # 3-class stance classifier
│   ├── linguistic-analyzer.ts # NLP feature extraction
│   └── exp-*.ts              # Individual experiments
├── pilot/                    # Round 1 pilot data
├── results/                  # All experiment NDJSON data
├── whitepaper.tex / .pdf     # Full research whitepaper
├── onepager.tex / .pdf       # Marketing one-pager
└── install.sh                # One-line installer
```

## License

MIT
