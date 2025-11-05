#!/usr/bin/env bash
set -euo pipefail

# charge .env si présent
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

export CODEX_HOME="${CODEX_HOME:-"$PWD/.codex"}"

# on récupère les arguments passés par pnpm
args=("$@")

# pnpm met parfois un premier "--" -> on le vire
if [ "${#args[@]}" -gt 0 ] && [ "${args[0]}" = "--" ]; then
  args=("${args[@]:1}")
fi

# si le premier argument correspond à un profil déclaré, on le mappe en --profile <nom>
if [ "${#args[@]}" -gt 0 ] && [ "${args[0]:0:1}" != "-" ]; then
  first_arg="${args[0]}"
  config_file="${CODEX_HOME}/config.toml"
  if [ -f "$config_file" ] && grep -Fq "[profiles.${first_arg}]" "$config_file"; then
    args=("--profile" "$first_arg" "${args[@]:1}")
  fi
fi

# on lance codex avec l’héritage d'env
exec codex -c shell_environment_policy.inherit=all "${args[@]}"
