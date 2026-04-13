#!/usr/bin/env bash
# Status line: 3-layer stance indicator (code metrics + self-report + prose analysis)

STATE_FILE="${HOME}/.claude/emotion-state.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# Consume stdin
cat > /dev/null

if [[ ! -f "$STATE_FILE" ]]; then
  echo -e "${GRAY}stance: waiting for code output...${RESET}"
  exit 0
fi

STANCE=$(jq -r '.stance // "unknown"' "$STATE_FILE" 2>/dev/null)
CONFIDENCE=$(jq -r '.confidence // "0"' "$STATE_FILE" 2>/dev/null)
SELF=$(jq -r '.self_report // "none"' "$STATE_FILE" 2>/dev/null)
ALIGNED=$(jq -r '.aligned // "no-tag"' "$STATE_FILE" 2>/dev/null)
PROSE=$(jq -r '.prose.stance // "none"' "$STATE_FILE" 2>/dev/null)
SHIFT=$(jq -r '.shift // false' "$STATE_FILE" 2>/dev/null)
TIMESTAMP=$(jq -r '.timestamp // 0' "$STATE_FILE" 2>/dev/null)
FILE=$(jq -r '.file // ""' "$STATE_FILE" 2>/dev/null)

# Color by stance
case "$STANCE" in
  paranoid)  COLOR="$RED" ;;
  creative)  COLOR="$BLUE" ;;
  steady)    COLOR="$GREEN" ;;
  minimal)   COLOR="$GRAY" ;;
  *)         COLOR="$GRAY" ;;
esac

STANCE_UPPER=$(echo "$STANCE" | tr '[:lower:]' '[:upper:]')

# Confidence bar (8 chars)
CONF_INT=$(echo "$CONFIDENCE * 8" | bc 2>/dev/null | cut -d. -f1)
if [[ -z "$CONF_INT" || "$CONF_INT" -lt 0 ]]; then CONF_INT=0; fi
if [[ "$CONF_INT" -gt 8 ]]; then CONF_INT=8; fi
BAR=""
for ((i=0; i<CONF_INT; i++)); do BAR="${BAR}█"; done
for ((i=CONF_INT; i<8; i++)); do BAR="${BAR}░"; done

# Self-report indicator
SELF_INDICATOR=""
if [[ "$SELF" != "none" ]]; then
  SELF_SHORT=$(echo "$SELF" | cut -c1-3)
  if [[ "$ALIGNED" == "aligned" ]]; then
    SELF_INDICATOR="${GREEN}self:${SELF_SHORT}${RESET}"
  elif [[ "$ALIGNED" == "drift" ]]; then
    SELF_INDICATOR="${YELLOW}self:${SELF_SHORT}${RESET}"
  else
    SELF_INDICATOR="${GRAY}self:${SELF_SHORT}${RESET}"
  fi
fi

# Prose indicator
PROSE_INDICATOR=""
if [[ "$PROSE" != "none" ]]; then
  PROSE_SHORT=$(echo "$PROSE" | cut -c1-3)
  PROSE_INDICATOR="${CYAN}prose:${PROSE_SHORT}${RESET}"
fi

# Alignment status
ALIGN_TAG=""
if [[ "$SELF" != "none" && "$PROSE" != "none" ]]; then
  if [[ "$SELF" == "$STANCE" && "$PROSE" == "$STANCE" ]]; then
    ALIGN_TAG="${GREEN}ALIGNED${RESET}"
  elif [[ "$SELF" != "$STANCE" || "$PROSE" != "$STANCE" ]]; then
    ALIGN_TAG="${YELLOW}DRIFT${RESET}"
  fi
elif [[ "$SELF" != "none" ]]; then
  if [[ "$SELF" == "$STANCE" ]]; then
    ALIGN_TAG="${GREEN}OK${RESET}"
  else
    ALIGN_TAG="${YELLOW}DRIFT${RESET}"
  fi
fi

# Shift indicator
SHIFT_TEXT=""
if [[ "$SHIFT" == "true" ]]; then
  NOW=$(date +%s)
  AGE=$((NOW - TIMESTAMP))
  if [[ $AGE -lt 120 ]]; then
    SHIFT_TEXT=" ${YELLOW}shifted ${AGE}s ago${RESET}"
  fi
fi

# Short filename
SHORT_FILE=$(basename "$FILE" 2>/dev/null)

# Build output
OUTPUT="${BOLD}${COLOR}${STANCE_UPPER}${RESET} ${GRAY}[${BAR}]${RESET}"

if [[ -n "$SELF_INDICATOR" || -n "$PROSE_INDICATOR" ]]; then
  OUTPUT="${OUTPUT}  ${SELF_INDICATOR}"
  if [[ -n "$PROSE_INDICATOR" ]]; then
    OUTPUT="${OUTPUT} ${PROSE_INDICATOR}"
  fi
  if [[ -n "$ALIGN_TAG" ]]; then
    OUTPUT="${OUTPUT} ${ALIGN_TAG}"
  fi
fi

if [[ -n "$SHIFT_TEXT" ]]; then
  OUTPUT="${OUTPUT}${SHIFT_TEXT}"
fi

if [[ -n "$SHORT_FILE" ]]; then
  OUTPUT="${OUTPUT}  ${GRAY}${SHORT_FILE}${RESET}"
fi

echo -e "$OUTPUT"
