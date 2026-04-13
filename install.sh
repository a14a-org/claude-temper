#!/usr/bin/env bash
set -euo pipefail

# claude-temper installer
# Usage: curl -fsSL https://raw.githubusercontent.com/USER/claude-temper/main/install.sh | bash
# Uninstall: curl -fsSL ... | bash -s -- --uninstall

REPO="https://github.com/a14a-org/claude-temper.git"
CLONE_DIR="${HOME}/.claude/skills/claude-temper"
HOOK_DST="${HOME}/.claude/hooks/emotion-post-tool-use.sh"
STATUS_DST="${HOME}/.claude/status/stance-indicator.sh"
STATE_FILE="${HOME}/.claude/emotion-state.json"
SETTINGS="${HOME}/.claude/settings.json"

info()  { printf "\033[36m[emotions]\033[0m %s\n" "$1"; }
ok()    { printf "\033[32m[emotions]\033[0m %s\n" "$1"; }
warn()  { printf "\033[33m[emotions]\033[0m %s\n" "$1"; }
fail()  { printf "\033[31m[emotions]\033[0m %s\n" "$1" >&2; exit 1; }

has_python() { command -v python3 >/dev/null 2>&1; }

json_merge() {
  python3 - "$1" "$2" <<'PYEOF'
import json, sys, os
path = sys.argv[1]
enable_statusbar = sys.argv[2] == "true" if len(sys.argv) > 2 else False
settings = json.load(open(path)) if os.path.exists(path) else {}

# PostToolUse hook (always)
hook = {"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "~/.claude/hooks/emotion-post-tool-use.sh", "async": True}]}
post = settings.setdefault("hooks", {}).setdefault("PostToolUse", [])
if not any(any(hh.get("command","").endswith("emotion-post-tool-use.sh") for hh in h.get("hooks",[])) for h in post):
    post.append(hook)

# Stop hook + status line (only with --with-statusbar)
if enable_statusbar:
    stop_hook = {"hooks": [{"type": "command", "command": "~/.claude/hooks/emotion-stop.sh", "async": True}]}
    stop = settings.setdefault("hooks", {}).setdefault("Stop", [])
    if not any(any(hh.get("command","").endswith("emotion-stop.sh") for hh in h.get("hooks",[])) for h in stop):
        stop.append(stop_hook)
    if "statusLine" not in settings:
        settings["statusLine"] = {"type": "command", "command": "~/.claude/status/stance-indicator.sh", "refreshInterval": 5}

json.dump(settings, open(path, "w"), indent=2); open(path, "a").write("\n")
PYEOF
}

json_remove() {
  python3 - "$1" <<'PYEOF'
import json, sys, os
path = sys.argv[1]
if not os.path.exists(path): sys.exit(0)
settings = json.load(open(path))
hooks = settings.get("hooks", {})
hooks["PostToolUse"] = [h for h in hooks.get("PostToolUse", [])
    if not any(hh.get("command","").endswith("emotion-post-tool-use.sh") for hh in h.get("hooks",[]))]
if not hooks["PostToolUse"]: del hooks["PostToolUse"]
if not hooks: del settings["hooks"]
if settings.get("statusLine",{}).get("command","").endswith("stance-indicator.sh"): del settings["statusLine"]
json.dump(settings, open(path, "w"), indent=2); open(path, "a").write("\n")
PYEOF
}

# --- uninstall ---
uninstall() {
  info "Uninstalling claude-temper..."
  has_python || fail "python3 required for safe settings.json editing"

  [ -f "$SETTINGS" ] && json_remove "$SETTINGS" && ok "Removed hook + status config from settings.json"
  [ -f "$HOOK_DST" ]   && rm "$HOOK_DST"   && ok "Removed $HOOK_DST"
  [ -f "$STATUS_DST" ] && rm "$STATUS_DST"  && ok "Removed $STATUS_DST"
  [ -f "$STATE_FILE" ] && rm "$STATE_FILE"  && ok "Removed $STATE_FILE"
  [ -d "$CLONE_DIR" ]  && rm -rf "$CLONE_DIR" && ok "Removed $CLONE_DIR"

  ok "Uninstall complete."
  exit 0
}

# --- install ---
install() {
  has_python || fail "python3 required for safe settings.json editing"
  command -v git >/dev/null 2>&1 || fail "git is required"

  local ENABLE_STATUSBAR=false
  for arg in "$@"; do
    case "$arg" in
      --with-statusbar) ENABLE_STATUSBAR=true ;;
    esac
  done

  info "Installing claude-temper..."

  # 1. Clone or update skill
  if [ -d "$CLONE_DIR/.git" ]; then
    info "Updating existing clone..."
    git -C "$CLONE_DIR" pull --ff-only --quiet 2>/dev/null || warn "Pull failed; using existing version"
  else
    rm -rf "$CLONE_DIR" 2>/dev/null || true
    mkdir -p "$(dirname "$CLONE_DIR")"
    git clone --single-branch --depth 1 --quiet "$REPO" "$CLONE_DIR"
  fi
  ok "Skill installed to $CLONE_DIR"

  # 2. Copy hook (always — powers /detect and mode verification)
  mkdir -p "$(dirname "$HOOK_DST")"
  cp "$CLONE_DIR/skill/hooks/post-tool-use.sh" "$HOOK_DST"
  chmod +x "$HOOK_DST"
  ok "Hook installed to $HOOK_DST"

  # 3. Merge hook into settings.json (always)
  mkdir -p "$(dirname "$SETTINGS")"
  json_merge "$SETTINGS" "$ENABLE_STATUSBAR"
  ok "Hook config merged into $SETTINGS"

  # 4. Status bar (opt-in only)
  if [ "$ENABLE_STATUSBAR" = true ]; then
    mkdir -p "$(dirname "$STATUS_DST")"
    cp "$CLONE_DIR/skill/hooks/stop.sh" "${HOME}/.claude/hooks/emotion-stop.sh"
    chmod +x "${HOME}/.claude/hooks/emotion-stop.sh"
    cp "$CLONE_DIR/skill/status/stance-indicator.sh" "$STATUS_DST"
    chmod +x "$STATUS_DST"
    ok "Status bar installed (experimental)"

    if [ ! -f "$STATE_FILE" ]; then
      echo '{"stance":"neutral","confidence":0}' > "$STATE_FILE"
    fi
  fi

  echo ""
  ok "claude-temper installed successfully."
  echo ""
  info "Modes:  /paranoid  /creative  /steady  /minimal  /fresh-eyes"
  info "Detect: /detect [file]"
  info ""

  if [ "$ENABLE_STATUSBAR" = false ]; then
    info "Live status bar available (experimental):"
    info "  Re-run with: curl -fsSL <url> | bash -s -- --with-statusbar"
  else
    warn "Status bar is EXPERIMENTAL — detection accuracy varies by mode."
    info "  Paranoid detection: ~80% accurate"
    info "  Other modes: ~40-60% accurate (best with self-annotation)"
  fi

  echo ""
  info "Uninstall: curl -fsSL <url> | bash -s -- --uninstall"
}

# --- entrypoint ---
case "${1:-}" in
  --uninstall|-u) uninstall ;;
  *)              install ;;
esac
