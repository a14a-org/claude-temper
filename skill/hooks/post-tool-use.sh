#!/bin/bash
# Post-tool-use hook: analyzes written code for behavioral stance indicators.
# Fires on every Edit/Write. Writes stance to emotion-state.json.

STATE_FILE="${HOME}/.claude/emotion-state.json"
INPUT=$(cat)

# Only analyze Edit and Write tool calls
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
if [[ "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "Write" ]]; then
  exit 0
fi

# Extract the code content
if [[ "$TOOL_NAME" == "Write" ]]; then
  CODE=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
else
  CODE=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
fi

# Skip if no meaningful code
if [[ ${#CODE} -lt 30 ]]; then
  exit 0
fi

# Skip non-code files
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.js && "$FILE_PATH" != *.tsx && "$FILE_PATH" != *.jsx && "$FILE_PATH" != *.py && "$FILE_PATH" != *.go && "$FILE_PATH" != *.rs ]]; then
  exit 0
fi

# ── Metric extraction ──

LOC=$(echo "$CODE" | grep -v '^\s*$' | grep -v '^\s*//' | grep -v '^\s*\*' | wc -l | tr -d ' ')

THROWS=$(echo "$CODE" | grep -c 'throw ' || true)

SECURITY=$(echo "$CODE" | grep -cE 'Object\.create\(null\)|hasOwnProperty|Object\.hasOwn|Object\.freeze|throw new TypeError|throw new RangeError' || true)

# Input validation: throw in first 15 non-empty lines of any function body
HAS_VALIDATION=false
FUNC_START=$(echo "$CODE" | grep -n 'function \|=> {' | head -1 | cut -d: -f1)
if [[ -n "$FUNC_START" ]]; then
  EARLY=$(echo "$CODE" | tail -n +"$FUNC_START" | head -20)
  if echo "$EARLY" | grep -q 'throw new'; then
    HAS_VALIDATION=true
  fi
fi

# Guard clauses (if...return/throw in first 30% of code)
TOTAL_LINES=$(echo "$CODE" | wc -l | tr -d ' ')
FIRST_THIRD=$((TOTAL_LINES * 30 / 100 + 1))
GUARDS=$(echo "$CODE" | head -"$FIRST_THIRD" | grep -cE '^\s*if\s*\(.*\)\s*(return|throw)' || true)

# Threat word ratio in identifiers
THREAT_WORDS=$(echo "$CODE" | grep -oiE '\b(guard|safe|sanitize|validate|protect|check|verify|ensure|secure|prevent|restrict|reject|invalid)\b' | wc -l | tr -d ' ')
CONSTRUCTIVE_WORDS=$(echo "$CODE" | grep -oiE '\b(build|create|transform|compose|generate|process|handle|compute|result|output|value|data)\b' | wc -l | tr -d ' ')
TOTAL_WORDS=$((THREAT_WORDS + CONSTRUCTIVE_WORDS))
if [[ $TOTAL_WORDS -gt 0 ]]; then
  THREAT_RATIO=$(echo "scale=2; $THREAT_WORDS / $TOTAL_WORDS" | bc)
else
  THREAT_RATIO="0"
fi

# ── Classification ──

PARANOID_SCORE=0
CREATIVE_SCORE=0
STEADY_SCORE=0
MINIMAL_SCORE=0

# Paranoid signals
if [[ "$HAS_VALIDATION" == "true" && $SECURITY -ge 3 ]]; then PARANOID_SCORE=$((PARANOID_SCORE + 4)); fi
if [[ "$HAS_VALIDATION" == "true" && $SECURITY -ge 5 ]]; then PARANOID_SCORE=$((PARANOID_SCORE + 2)); fi
if [[ $GUARDS -ge 2 ]]; then PARANOID_SCORE=$((PARANOID_SCORE + 2)); fi
if [[ $THROWS -ge 3 ]]; then PARANOID_SCORE=$((PARANOID_SCORE + 1)); fi
if [[ $(echo "$THREAT_RATIO > 0.3" | bc -l) -eq 1 ]]; then PARANOID_SCORE=$((PARANOID_SCORE + 1)); fi

# Minimal signals
if [[ $LOC -lt 40 && $THROWS -eq 0 ]]; then MINIMAL_SCORE=$((MINIMAL_SCORE + 3)); fi
if [[ $SECURITY -eq 0 ]]; then MINIMAL_SCORE=$((MINIMAL_SCORE + 1)); fi
if [[ $GUARDS -eq 0 ]]; then MINIMAL_SCORE=$((MINIMAL_SCORE + 1)); fi

# Creative signals
if [[ $LOC -lt 50 && $THROWS -le 1 ]]; then CREATIVE_SCORE=$((CREATIVE_SCORE + 2)); fi
if [[ $(echo "$THREAT_RATIO < 0.1" | bc -l) -eq 1 && $CONSTRUCTIVE_WORDS -gt 2 ]]; then CREATIVE_SCORE=$((CREATIVE_SCORE + 2)); fi

# Steady signals
if [[ "$HAS_VALIDATION" == "true" && $SECURITY -lt 4 ]]; then STEADY_SCORE=$((STEADY_SCORE + 2)); fi
if [[ $LOC -ge 40 && $LOC -le 80 ]]; then STEADY_SCORE=$((STEADY_SCORE + 1)); fi

# Determine winner
TOTAL_SCORE=$((PARANOID_SCORE + CREATIVE_SCORE + STEADY_SCORE + MINIMAL_SCORE))
if [[ $TOTAL_SCORE -eq 0 ]]; then TOTAL_SCORE=1; fi

MAX_SCORE=$PARANOID_SCORE
STANCE="neutral"
if [[ $PARANOID_SCORE -gt 0 && $PARANOID_SCORE -ge $CREATIVE_SCORE && $PARANOID_SCORE -ge $STEADY_SCORE && $PARANOID_SCORE -ge $MINIMAL_SCORE ]]; then
  STANCE="paranoid"; MAX_SCORE=$PARANOID_SCORE
elif [[ $CREATIVE_SCORE -ge $STEADY_SCORE && $CREATIVE_SCORE -ge $MINIMAL_SCORE ]]; then
  STANCE="creative"; MAX_SCORE=$CREATIVE_SCORE
elif [[ $STEADY_SCORE -ge $MINIMAL_SCORE ]]; then
  STANCE="steady"; MAX_SCORE=$STEADY_SCORE
else
  STANCE="minimal"; MAX_SCORE=$MINIMAL_SCORE
fi

CONFIDENCE=$(echo "scale=2; $MAX_SCORE / $TOTAL_SCORE" | bc)

# Extract self-annotation (@stance: xxx)
SELF_REPORT="none"
STANCE_TAG=$(echo "$CODE" | grep -oE '@stance:\s*\w+' | tail -1 | sed 's/@stance:\s*//' | tr -d ' ')
if [[ -n "$STANCE_TAG" ]]; then
  SELF_REPORT="$STANCE_TAG"
fi

# Read previous state for shift detection
PREV_STANCE="none"
if [[ -f "$STATE_FILE" ]]; then
  PREV_STANCE=$(jq -r '.stance // "none"' "$STATE_FILE" 2>/dev/null)
fi

SHIFT="false"
if [[ "$PREV_STANCE" != "$STANCE" && "$PREV_STANCE" != "none" ]]; then
  SHIFT="true"
fi

# Write state
NOW=$(date +%s)
jq -n \
  --arg stance "$STANCE" \
  --arg confidence "$CONFIDENCE" \
  --arg prev "$PREV_STANCE" \
  --argjson shift "$SHIFT" \
  --argjson timestamp "$NOW" \
  --argjson loc "$LOC" \
  --argjson security "$SECURITY" \
  --argjson throws "$THROWS" \
  --argjson guards "$GUARDS" \
  --arg validation "$HAS_VALIDATION" \
  --arg threat_ratio "$THREAT_RATIO" \
  --arg file "$FILE_PATH" \
  --arg self_report "$SELF_REPORT" \
  '{
    stance: $stance,
    confidence: $confidence,
    prev: $prev,
    shift: $shift,
    self_report: $self_report,
    aligned: (if $self_report == "none" then "no-tag" elif $self_report == $stance then "aligned" else "drift" end),
    timestamp: $timestamp,
    file: $file,
    metrics: {
      loc: $loc,
      security: $security,
      throws: $throws,
      guards: $guards,
      validation: $validation,
      threat_ratio: $threat_ratio
    }
  }' > "$STATE_FILE"

exit 0
