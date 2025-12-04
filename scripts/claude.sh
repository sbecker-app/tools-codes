#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# charge .env si présent
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  . "$PROJECT_DIR/.env"
  set +a
fi

# définit le répertoire de config local pour Claude
CLAUDE_CONFIG_DIR="${CLAUDE_CONFIG_DIR:-"$PROJECT_DIR/.claude"}"

# on récupère les arguments passés par pnpm
args=("$@")

# pnpm met parfois un premier "--" -> on le vire
if [ "${#args[@]}" -gt 0 ] && [ "${args[0]}" = "--" ]; then
  args=("${args[@]:1}")
fi

# Vérifie si le premier argument est un profil connu
PROFILE=""
SYSTEM_PROMPT=""

if [ "${#args[@]}" -gt 0 ]; then
  case "${args[0]}" in
    ml)
      PROFILE="ml"
      args=("${args[@]:1}")  # retire le profil des arguments
      ;;
    vision)
      PROFILE="vision"
      args=("${args[@]:1}")
      ;;
  esac
fi

# Configuration selon le profil
if [ -n "$PROFILE" ]; then
  PROFILE_DIR="$PROJECT_DIR/projects/$PROFILE/.config-claude"

  # Vérifie si le profil existe
  if [ -d "$PROFILE_DIR" ]; then
    MCP_CONFIG_FILE="$PROFILE_DIR/mcp_settings.json"

    # Charge le system prompt si présent
    if [ -f "$PROFILE_DIR/system-prompt.md" ]; then
      SYSTEM_PROMPT="$PROFILE_DIR/system-prompt.md"
    fi
  else
    # Fallback : utilise la commande slash si pas de profil dédié
    echo "⚠️  Profil '$PROFILE' non trouvé dans $PROFILE_DIR"
    echo "💡 Utilise /ml pour charger le contexte Millenium"
    MCP_CONFIG_FILE="$CLAUDE_CONFIG_DIR/mcp_settings.json"
  fi
else
  MCP_CONFIG_FILE="$CLAUDE_CONFIG_DIR/mcp_settings.json"
fi

# Construction de la commande
CMD=(claude)

if [ -f "$MCP_CONFIG_FILE" ]; then
  CMD+=(--mcp-config "$MCP_CONFIG_FILE")
fi

if [ -n "$SYSTEM_PROMPT" ] && [ -f "$SYSTEM_PROMPT" ]; then
  CMD+=(--system-prompt "$(cat "$SYSTEM_PROMPT")")
fi

# Ajoute les arguments restants
if [ "${#args[@]}" -gt 0 ]; then
  CMD+=("${args[@]}")
fi

# Lance Claude
exec "${CMD[@]}"
