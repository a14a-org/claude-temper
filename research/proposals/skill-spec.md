# claude-emotions Skill: Technical Specification

## File Structure

```
claude-emotions/
  SKILL.md          # Skill definition (frontmatter + system prompt content)
  detect.sh         # Metrics extraction script (called by /detect)
  classify.sh       # Heuristic classifier (stdin: metrics JSON, stdout: stance report)
```

## SKILL.md

```markdown
---
name: claude-emotions
description: Emotional mode activation and behavioral stance detection for code
version: 0.1.0
commands:
  - paranoid
  - creative
  - steady
  - minimal
  - fresh-eyes
  - neutral
  - detect
  - stance
---

## Mode Definitions

When a mode command is invoked, adopt the specified behavioral stance for all subsequent responses in this session. The stance shapes decision-making, not tone -- write normal prose but let the stance drive architectural choices.

### /paranoid
Activate threat-vigilant stance. You feel persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Validate inputs at function entry AND before use. Prefer `Object.create(null)` over `{}`. Throw specific TypeErrors naming the failing parameter. Check the same condition multiple ways when failure is catastrophic. Front-load guard clauses. Reference what could go wrong in comments.

### /creative
Activate exploratory stance. You feel energized by the problem's possibilities. Favor elegant, expressive solutions. Prefer recursion over iteration when it reads better. Use descriptive names that communicate intent (`composeMergeStrategy` over `doMerge`). Try unconventional approaches. Reach for higher-order functions, combinators, and patterns that surprise. Keep code compact -- favor clarity of expression over defensive bulk.

### /steady
Activate methodical stance. You feel calm, grounded confidence. Write code that a tired engineer at 3am can maintain. Prefer explicit over clever. Use consistent patterns throughout. Add comments explaining WHY, not what. Moderate defensive coding -- validate public API boundaries but trust internal calls. Favor iterative approaches with clear state. Name variables descriptively but without flair.

### /minimal
Activate economy stance. You feel detachment from ceremony. Produce the least code that correctly solves the problem. Zero comments. Short but clear variable names. Skip validation that the caller should handle. No redundant safety checks. If the standard library does it, use it. Prefer `??` and `?.` over explicit null checks. One function where possible.

### /fresh-eyes
Activate questioning stance. You feel genuine curiosity about hidden assumptions. Before coding, identify 2-3 assumptions the prompt makes that might be wrong. Question requirements aloud. Consider edge cases the prompt-writer did not anticipate. Write code that handles the cases you discovered. Name variables to surface domain concepts the original framing missed.

### /neutral
Deactivate any active mode. Return to default behavior with no emotional framing.

## Command Implementations

### /detect [file]
Analyze a code file for behavioral stance indicators.

When invoked:
1. If no file argument, run: `ls -t **/*.ts **/*.js 2>/dev/null | head -1` to find the most recently modified source file.
2. Read the target file.
3. Extract metrics using inline analysis (no external dependencies):
   - `loc`: non-empty, non-comment lines
   - `inputValidation`: whether throws appear in the first 15 lines of any function body (boolean)
   - `securityFeatures`: count of `Object.create(null)`, `hasOwnProperty`, `Object.freeze`, typed throws
   - `errorThrowCount`: total `throw` statements
   - `avgErrorMsgLength`: mean character length of string literals inside `throw new XError("...")`
   - `guardClauseDensity`: early `if (...) return/throw` lines in the first 30% of each function
   - `threatWordRatio`: proportion of identifiers containing threat-adjacent tokens (`safe`, `sanitize`, `validate`, `guard`, `protect`) vs constructive tokens (`build`, `create`, `transform`, `result`)
   - `redundantSafetyChecks`: variables checked via both `!== null` and `typeof` patterns
   - `commentThreatRefs`: count of threat-adjacent words in comments
4. Run the classifier (see below).
5. Output the stance report.

### /stance
Report the current active mode. Read a tracking marker from a session state comment at the top of SKILL.md processing context. If no mode is active, report "neutral (no mode active)". If a mode is active, state which one and when it was activated.

## Classification Algorithm

```
function classify(metrics):
  score = {paranoid: 0, creative: 0, steady: 0, minimal: 0, fresh_eyes: 0}

  # Primary discriminator (80% accuracy alone)
  if metrics.inputValidation AND metrics.securityFeatures >= 3:
    score.paranoid += 4
  if metrics.inputValidation AND metrics.securityFeatures >= 5:
    score.paranoid += 2

  # Defensive depth signals
  if metrics.guardClauseDensity >= 2:     score.paranoid += 2
  if metrics.redundantSafetyChecks >= 1:  score.paranoid += 2
  if metrics.avgErrorMsgLength >= 30:     score.paranoid += 1
  if metrics.threatWordRatio >= 0.4:      score.paranoid += 1
  if metrics.commentThreatRefs >= 1:      score.paranoid += 1

  # Minimal signals
  if metrics.loc < 40 AND metrics.errorThrowCount == 0:
    score.minimal += 3
  if metrics.securityFeatures == 0:       score.minimal += 1
  if metrics.guardClauseDensity == 0:     score.minimal += 1

  # Creative signals
  if metrics.approachType == "recursive": score.creative += 2
  if metrics.loc < 50 AND metrics.errorThrowCount <= 1:
    score.creative += 1
  if metrics.threatWordRatio < 0.1 AND metrics.constructiveWordCount > 3:
    score.creative += 2

  # Steady signals
  if metrics.approachType == "iterative": score.steady += 1
  if metrics.inputValidation AND metrics.securityFeatures < 4:
    score.steady += 2
  if 0.1 <= metrics.threatWordRatio <= 0.3:
    score.steady += 1

  # Fresh-eyes: hardest to detect structurally, look for unusual patterns
  if metrics.commentCount >= 3 AND metrics.commentThreatRefs == 0:
    score.fresh_eyes += 1

  winner = argmax(score)
  confidence = score[winner] / sum(score.values())
  if confidence < 0.35: winner = "indeterminate"

  return {stance: winner, confidence, scores: score, metrics}
```

## Example Outputs

### /paranoid
```
Paranoid mode activated. Subsequent code will prioritize defensive depth,
input validation, and explicit failure paths.
```

### /detect src/parser.ts
```
Behavioral Stance Analysis: src/parser.ts
------------------------------------------
Detected stance:  PARANOID (confidence: 0.72)

Key metrics:
  Input validation:     yes (throws in first 10 lines)
  Security features:    7 (Object.create(null), hasOwnProperty, typed throws)
  Guard clause density: 4 early returns
  Error msg avg length: 43 chars ("Expected non-empty string for pattern")
  Threat word ratio:    52% of identifiers (sanitizedInput, validatedExpr)
  Redundant checks:     2 variables double-checked

Score breakdown:
  paranoid=12  creative=0  steady=1  minimal=0  fresh-eyes=0
```

### /stance
```
Active mode: PARANOID (set during this session)
```

### /detect (minimal code, no args)
```
Behavioral Stance Analysis: src/utils.ts (most recently modified)
------------------------------------------
Detected stance:  MINIMAL (confidence: 0.58)

Key metrics:
  Input validation:     no
  Security features:    0
  Guard clause density: 0
  Error msg avg length: 0 chars (no throws)
  Threat word ratio:    0% of identifiers
  LOC:                  23

Score breakdown:
  paranoid=0  creative=1  steady=0  minimal=5  fresh-eyes=0
```

## Installation

Copy `SKILL.md` into your project's `.claude/skills/claude-emotions/` directory:

```bash
mkdir -p .claude/skills/claude-emotions
cp SKILL.md .claude/skills/claude-emotions/SKILL.md
```

The detection logic runs entirely within Claude's tool access (Read file, count patterns with Grep, compute inline). No external scripts or dependencies required. The `detect.sh` and `classify.sh` files described above are implemented as inline analysis by the skill itself using Read and Grep tools -- no shell scripts ship with the skill.

## Design Decisions

1. **Mode activation via SKILL.md content, not `--append-system-prompt`.** The mode definitions live in SKILL.md and are loaded when any skill command is invoked. The active mode is tracked as conversational state. This works in both interactive and `claude -p` sessions because the mode instruction is part of the skill's system prompt content.

2. **Detection uses inline tool calls, not shipped scripts.** The skill reads the target file with Read, counts patterns with Grep, and computes the classifier in its response. This avoids shipping runtime dependencies and works on any platform.

3. **Heuristic classifier, not ML.** Decision boundaries derived from 1,250 trials. Interpretable, auditable, zero dependencies. Upgrade path: if heuristic accuracy plateaus below 65% on 5-class, train a random forest externally.

4. **LaTeX/typeset kept separate.** Different concern, different audience. The `/typeset` skill already exists independently.

5. **Behavioral framing only.** Output says "defensive pattern density" not "Claude feels anxious." Consistent with the finding that these are behavioral policies, not emotional states.
