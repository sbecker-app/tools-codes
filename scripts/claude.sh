#!/usr/bin/env bash
set -euo pipefail

# charge .env si présent
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

# définit le répertoire de config local pour Claude
CLAUDE_CONFIG_DIR="${CLAUDE_CONFIG_DIR:-"$PWD/.claude"}"

# crée le répertoire si nécessaire
mkdir -p "$CLAUDE_CONFIG_DIR"

# chemin vers le fichier MCP config
MCP_CONFIG_FILE="$CLAUDE_CONFIG_DIR/mcp_settings.json"

# on récupère les arguments passés par pnpm
args=("$@")

# pnpm met parfois un premier "--" -> on le vire
if [ "${#args[@]}" -gt 0 ] && [ "${args[0]}" = "--" ]; then
  args=("${args[@]:1}")
fi

# on lance claude avec le fichier de config MCP local
if [ -f "$MCP_CONFIG_FILE" ]; then
  exec claude --mcp-config "$MCP_CONFIG_FILE" ${args[@]+"${args[@]}"}
else
  exec claude ${args[@]+"${args[@]}"}
fi
