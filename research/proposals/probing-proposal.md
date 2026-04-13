# Probing Proposal: Beyond Code Metrics

**Panel consensus** | 2026-04-12

---

## Answers to the Five Questions

**1. Most practical for the live status line?** Hidden self-annotation (#4). The mode prompts already exist in SKILL.md. Adding one line -- "append `// @stance: {mode, indicators}` to every code output" -- costs nothing. The PostToolUse hook already parses code content; extracting a JSON comment is one `grep`.

**2. Most honest signal?** Language analysis on response text (#2). It is observational, not self-report. The model does not know it is being analyzed. Hedging ratios and threat-word density in prose are involuntary behavioral leakage -- the same channel Anthropic's emotion vector research showed persists even under suppression.

**3. Can we access thinking blocks?** Not through hooks. The Stop hook receives `last_assistant_message` (the visible response), not thinking blocks. The `--output-format stream-json` flag exposes thinking in the CLI stream, but hooks do not receive stream events. The transcript JSONL may contain thinking content, but reading it from a hook during the session is fragile and undocumented. Thinking blocks are the gold mine in theory but inaccessible in practice today.

**4. Can we combine approaches?** Yes, and we should. Self-annotation provides the label (high accuracy when the model complies). Language analysis on the response text provides independent verification (catches cases where the model's behavior drifts from its self-label). The two signals are orthogonal: one is declared intent, the other is observed behavior. Disagreement between them is itself a signal -- it means the model's behavioral policy shifted away from the prompted mode.

**5. Privacy/UX concern with thinking blocks?** Moot for now since we cannot access them. If we could: thinking is the model's "internal" reasoning and users expect it to be ephemeral. Logging and analyzing it for stance detection would need explicit opt-in.

---

## TOP 2: Implement These

### Approach A: Response Text Linguistic Analysis (Stop Hook)

**What:** The Stop hook receives `last_assistant_message`. Extract three features: (1) hedging ratio -- count "might/could/should/perhaps" vs "will/always/must/ensures", (2) threat-word density in prose (not code) -- "handles edge cases", "prevents", "guards against", (3) response length in characters.

**Wiring:** Create `skill/hooks/stop.sh`. It reads `last_assistant_message` from stdin JSON. Strip code blocks (everything between triple backticks). On the remaining prose, run the three counts. Write results to `~/.claude/emotion-state.json` alongside the existing PostToolUse metrics. The status line script already reads that file.

**Why this one:** It is the only approach that detects behavioral stance the model did not explicitly declare. It catches drift -- when a user's frustrated debugging pushes the model from creative toward paranoid, the prose shifts before the code does. Our detection-signals.md already rated hedging ratio as "high power." And it requires exactly one new file.

### Approach B: Hidden Self-Annotation (Mode Prompt Modification)

**What:** Add one line to each mode prompt in SKILL.md: "At the end of every code response, include: `// @emotion-stance: {mode: '[MODE]', confidence: 'high|medium|low'}`". The PostToolUse hook extracts this annotation before running code metrics.

**Wiring:** Modify `post-tool-use.sh` to `grep -o '@emotion-stance: {[^}]*}'` from the code content. Parse the mode and confidence. Write as `self_report` field in `emotion-state.json`. The classifier then has two inputs: self-reported mode and code-metric-detected mode. When they agree, confidence goes up. When they disagree, flag it -- that disagreement is the most interesting signal in the entire system.

**Why this one:** Near-100% accuracy when the model complies. The real value is not the label itself but the **agreement/disagreement** with Approach A. A model that says "I am paranoid" but writes hedging-free, confident prose is exhibiting suppression -- exactly the phenomenon Anthropic documented.

### Combined Status Line Output

```
PARANOID [████████░░] 82%  self:paranoid  prose:paranoid  ALIGNED
CREATIVE [██████░░░░] 60%  self:creative  prose:paranoid  DRIFT !!
```

The second line is the interesting case. The model declares creative mode but its language patterns indicate paranoid behavior. That is a detected stance shift the user did not cause -- and it is the finding that makes this research publishable.

**Implementation: 2 files modified, 1 file created. Under 100 new lines of bash.**
