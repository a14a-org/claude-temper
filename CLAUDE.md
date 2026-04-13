Use Bun as the runtime. All experiment scripts run with `bun run src/<script>.ts`.

Experiments use `claude -p` CLI calls with `--system-prompt` (unbuffered) or `--append-system-prompt` (buffered). Results are NDJSON in `results/`.

The skill lives in `skill/SKILL.md`. Hooks are bash scripts in `skill/hooks/`. The status line script is in `skill/status/`.
