# Live Behavioral Stance Indicator: Implementation Proposal

**Panel**: Chen, Okafor, Petrov, Yamamoto, Santos, Park + Rivera (infrastructure)
**Date**: April 2026 | **Scope**: Claude Code status line + hooks integration

---

### Rivera: Architecture Decision

**Option A+B combined.** PostToolUse fires on every Edit/Write and captures code content in real-time. Stop hook runs transcript analysis for linguistic features from the assistant message. Both write to `~/.claude/emotion-state.json`. The status line script reads that file on every refresh cycle.

Performance concern is minimal. PostToolUse runs a shell script that greps for threat words and counts patterns -- this takes <50ms even on large files. We are not parsing ASTs in bash; we are counting string matches. The hook script exits fast and does not block Claude's next action.

The state file schema:

```json
{"stance":"paranoid","confidence":0.72,"prev":"steady","shift_age_sec":14,"metrics":{"validation":true,"security":5,"threat_ratio":0.31,"loc":87}}
```

### Okafor: What Bash Can Extract

From PostToolUse `tool_input` (the code being written), bash can reliably extract: (1) `grep -c 'throw new'` for error throw count, (2) `grep -c 'Object.create(null)\|hasOwnProperty\|Object.freeze\|Object.hasOwn'` for security features, (3) `wc -l` for LOC, (4) `grep -c 'if.*return\|if.*throw'` in the first 30% of lines for guard clause density, (5) threat word ratio via `grep -oE '[a-z]+' | grep -c` against our word lists. These five features alone give us 80% binary accuracy from our existing data. Skip AST parsing, skip error message length -- those are Tier 2 refinements for later.

### Santos: Status Line Designs

**Design 1 -- Compact single-line (recommended):**
```
[PARANOID !!!] ^^steady  validation:5 guards:3
```
Stance name in brackets, `^^` indicates upward shift from previous, metrics that changed.

**Design 2 -- Color-coded with confidence bar:**
```
stance: PARANOID [========--] 82%  (was: steady 14s ago)
```
Red for paranoid, green for steady, blue for creative, gray for minimal. Confidence as a progress bar.

**Design 3 -- Minimal with drift arrow:**
```
PARANOID -> steady -> PARANOID  [high confidence]
```
Shows last 3 stances as a trail. Current stance in caps.

I recommend Design 2. Color conveys stance at a glance without reading. The shift indicator ("was: steady 14s ago") is the actionable information.

### Park: Shift Detection Over Static Label

**"Stance just shifted" is far more useful than "current stance is X."** A user in `/creative` mode who sees the stance has been "creative" for 10 minutes learns nothing. But seeing "SHIFTED: creative -> paranoid 8s ago" after a debugging prompt is immediately actionable -- the user's frustrated language just pushed the model into defensive mode. The shift event is the intervention point. Display the current stance always, but visually emphasize transitions with color flash or `!!` markers that fade after 30 seconds.

### Chen: User Stance Detection

Yes, but carefully. The Stop hook receives the full transcript including user messages. We can grep user messages for frustration markers: repeated "why doesn't this work", "this is broken", "just fix it", escalating message length, question marks per message. **Do not display "you seem frustrated."** Instead: "User input pattern: elevated correction density. Model may shift toward defensive/desperate stance." This is a leading indicator -- it warns BEFORE the model's code quality degrades. But ship it as opt-in. The default display shows model stance only.

### Yamamoto: Theoretical Note

We are building the first real-time behavioral policy monitor for an LLM. The shift detection Park describes is functionally a phase-transition detector -- it identifies the moment the model's active behavioral policy changes. This has direct application to the safety case: if a desperate user inadvertently pushes the model toward corner-cutting, the indicator fires before the degraded code ships.

### Consensus: Minimal Viable Implementation

**Three files. Under 200 lines total.**

1. **`hooks/post-tool-use.sh`** (~60 lines) -- Receives tool_input JSON on stdin. If tool is Edit or Write, extracts the code content. Counts: LOC, throw statements, security features, guard clauses, threat word matches. Computes stance using simplified heuristic (paranoid if security>=3 AND validation, minimal if LOC<40 AND throws==0, creative if LOC<50 AND threat_ratio<0.1, steady otherwise). Writes `~/.claude/emotion-state.json` with stance, confidence, previous stance, and timestamp.

2. **`hooks/stop.sh`** (~40 lines) -- Reads last assistant message from transcript. Counts hedging words, threat references, superlatives. Adjusts confidence in state file. Updates `shift_age_sec`.

3. **`status/stance-indicator.sh`** (~30 lines) -- Reads `~/.claude/emotion-state.json`. Formats output with ANSI colors. Shows: stance name (colored), confidence bar, shift indicator if shift_age < 60s. Prints one line to stdout.

**Configuration** (add to `.claude/settings.json`):
```json
{
  "hooks": {
    "PostToolUse": [{"command": "~/.claude/hooks/post-tool-use.sh"}],
    "Stop": [{"command": "~/.claude/hooks/stop.sh"}]
  },
  "status_line": "~/.claude/status/stance-indicator.sh"
}
```

**Priority**: Ship the PostToolUse hook + status line first (files 1 and 3). This gives live updates on every code write. Add the Stop hook (file 2) as a refinement for linguistic analysis between tool calls.

---

*Endorsed by the full panel. Implementation target: single session. No dependencies beyond bash and jq.*
