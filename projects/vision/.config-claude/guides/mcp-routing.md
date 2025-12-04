# MCP Routing - Projet Vision

---

## Chemins projet Vision

| Ressource | Chemin |
|-----------|--------|
| **Racine projet** | `/Users/frx33355/Documents/dev/mcp/projects/vision` |
| **Config Claude** | `/Users/frx33355/Documents/dev/mcp/projects/vision/.config-claude` |
| **Data / MarkdownDB** | `/Users/frx33355/Documents/dev/mcp/projects/vision/data` |
| **Sessions Playwright** | `/Users/frx33355/Documents/dev/mcp/projects/vision/sessions` |
| **Documentation** | `/Users/frx33355/Documents/dev/mcp/projects/vision/docs` |
| **Specs** | `/Users/frx33355/Documents/dev/mcp/projects/vision/specs` |
| **Tests** | `/Users/frx33355/Documents/dev/mcp/projects/vision/tests` |
| **Assets** | `/Users/frx33355/Documents/dev/mcp/projects/vision/assets` |

---

## Regles de routage contextuel

| Contexte / Domaine | MCP cible | Description |
|--------------------|-----------|-------------|
| **GitHub** | `GitHub` | Commits, branches, merges, logs |
| **Notion** | `Notion` | Lecture/ecriture pages Notion |
| **Documentation technique** | `context7` | Doc des librairies et dependances |
| **Fichiers locaux** | `fs` | Navigation et R/W fichiers |
| **Commandes shell** | `shell` | Execution bash, pnpm, node |
| **Tests e2e** | `playwright` | Tests et captures automatisees |

---

## Variables d'environnement

```
VISION_ROOT=/Users/frx33355/Documents/dev/mcp/projects/vision
CONFIG_DIR=$VISION_ROOT/.config-claude
DATA_DIR=$VISION_ROOT/data
DOCS_DIR=$VISION_ROOT/docs
SESSIONS_DIR=$VISION_ROOT/sessions
```

---
*Derniere mise a jour: 2025-12-04*
