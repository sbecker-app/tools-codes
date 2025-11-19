#!/bin/bash
#
# Script d'installation des hooks Git
# Ce script copie tous les hooks depuis scripts/hooks/ vers .git/hooks/
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_SOURCE="$SCRIPT_DIR/hooks"
HOOKS_DEST="$SCRIPT_DIR/../.git/hooks"

echo "📦 Installation des hooks Git..."

if [ ! -d "$HOOKS_DEST" ]; then
    echo "❌ Erreur: Le répertoire .git/hooks n'existe pas."
    echo "   Assurez-vous d'être dans un dépôt Git."
    exit 1
fi

if [ ! -d "$HOOKS_SOURCE" ]; then
    echo "❌ Erreur: Le répertoire scripts/hooks n'existe pas."
    exit 1
fi

# Copie tous les hooks
for hook in "$HOOKS_SOURCE"/*; do
    if [ -f "$hook" ]; then
        hook_name=$(basename "$hook")
        echo "   Copie de $hook_name..."
        cp "$hook" "$HOOKS_DEST/$hook_name"
        chmod +x "$HOOKS_DEST/$hook_name"
    fi
done

echo "✅ Hooks installés avec succès!"
echo ""
echo "Hooks installés:"
ls -1 "$HOOKS_SOURCE"
