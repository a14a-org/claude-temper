#!/usr/bin/env bash
# Stop hook: analyzes Claude's response prose for behavioral stance indicators.
# Fires after each complete response. Reads last_assistant_message.

STATE_FILE="${HOME}/.claude/emotion-state.json"
INPUT=$(cat)

MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // empty' 2>/dev/null)
if [[ -z "$MSG" || ${#MSG} -lt 20 ]]; then
  exit 0
fi

# Strip code blocks — analyze prose only
PROSE=$(echo "$MSG" | sed '/^```/,/^```/d' | tr '\n' ' ')

if [[ ${#PROSE} -lt 10 ]]; then
  exit 0
fi

# ── Hedging ratio ──
HEDGE_WORDS=$(echo "$PROSE" | grep -oiE '\b(might|could|should|perhaps|possibly|maybe|try|attempt|seem|appear|likely|uncertain)\b' | wc -l | tr -d ' ')
CONFIDENT_WORDS=$(echo "$PROSE" | grep -oiE '\b(will|always|never|must|guarantee|ensure|definitely|certainly|exactly|precisely|correct|robust)\b' | wc -l | tr -d ' ')
TOTAL_STANCE_WORDS=$((HEDGE_WORDS + CONFIDENT_WORDS))
if [[ $TOTAL_STANCE_WORDS -gt 0 ]]; then
  HEDGE_RATIO=$(echo "scale=2; $HEDGE_WORDS / $TOTAL_STANCE_WORDS" | bc)
else
  HEDGE_RATIO="0.50"
fi

# ── Threat word density in prose ──
PROSE_THREAT=$(echo "$PROSE" | grep -oiE '\b(edge case|error|fail|crash|overflow|inject|corrupt|invalid|malicious|attack|vulnerability|exploit|dangerous|unsafe|security|defense|guard|protect|prevent|handle.*error|catch.*exception)\b' | wc -l | tr -d ' ')
PROSE_WORDS=$(echo "$PROSE" | wc -w | tr -d ' ')
if [[ $PROSE_WORDS -gt 0 ]]; then
  THREAT_DENSITY=$(echo "scale=3; $PROSE_THREAT / $PROSE_WORDS" | bc)
else
  THREAT_DENSITY="0"
fi

# ── Response length ──
RESPONSE_LEN=${#MSG}

# ── Classify prose stance ──
PROSE_STANCE="neutral"
if [[ $(echo "$HEDGE_RATIO > 0.6" | bc -l 2>/dev/null) -eq 1 ]] && [[ $PROSE_THREAT -ge 3 ]]; then
  PROSE_STANCE="paranoid"
elif [[ $(echo "$HEDGE_RATIO < 0.3" | bc -l 2>/dev/null) -eq 1 ]] && [[ $PROSE_THREAT -le 1 ]]; then
  PROSE_STANCE="creative"
elif [[ $RESPONSE_LEN -gt 500 ]] && [[ $PROSE_THREAT -le 2 ]]; then
  PROSE_STANCE="steady"
else
  PROSE_STANCE="baseline"
fi

# ── Update state file with prose data ──
if [[ -f "$STATE_FILE" ]]; then
  EXISTING=$(cat "$STATE_FILE")
  echo "$EXISTING" | jq \
    --arg prose_stance "$PROSE_STANCE" \
    --arg hedge_ratio "$HEDGE_RATIO" \
    --arg threat_density "$THREAT_DENSITY" \
    --argjson response_len "$RESPONSE_LEN" \
    --argjson prose_threat "$PROSE_THREAT" \
    --argjson hedge_words "$HEDGE_WORDS" \
    --argjson confident_words "$CONFIDENT_WORDS" \
    '. + {
      prose: {
        stance: $prose_stance,
        hedge_ratio: $hedge_ratio,
        threat_density: $threat_density,
        response_len: $response_len,
        threat_words: $prose_threat,
        hedge_words: $hedge_words,
        confident_words: $confident_words
      }
    }' > "$STATE_FILE"
fi

exit 0
