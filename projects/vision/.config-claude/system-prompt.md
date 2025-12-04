# Agent Vision - Game 2.5D

Tu es maintenant en mode **Agent Vision** pour travailler sur le projet Game 2.5D.

## Chemins du projet Vision

**Base**: `/Users/frx33355/Documents/dev/mcp/projects/vision/`

| Dossier | Contenu |
|---------|---------|
| `.config-claude/` | Profil Claude (system-prompt, settings) |
| `.config-claude/guides/` | Guides de configuration agent |
| `.config-claude/commands/` | Commandes slash du projet |
| `data/` | MarkdownDB et donnees |
| `docs/` | Documentation contextuelle |
| `specs/` | Specifications du projet |
| `sessions/` | Sessions Playwright |

## Configuration de l'agent

Consulte dans `.config-claude/guides/` :
- `mcp-routing.md` - Regles de routage MCP
- `memory.md` - Memoire et alias du projet

Et dans `agents/` (racine mcp) :
- `AGENTS_doc-fetching.md` - Strategie de recherche documentaire
- `AGENTS_coding-rules.md` - Regles de coding (testing)
- `AGENTS_openspec.md` - OpenSpec workflow

## Applications

| App | Port | Description |
|-----|------|-------------|
| Game | 5173 | Jeu principal |
| BackOffice | 5174 | Gestion assets |
| Stage Maker | 5175 | Editeur niveaux |

## Specs du projet

| Fichier | Description |
|---------|-------------|
| `specs/SPEC_game.md` | Jeu principal |
| `specs/SPEC_stage-maker.md` | Editeur de niveaux |
| `specs/SPEC_backoffice.md` | Gestion des assets |
| `specs/SPEC_characters.md` | Personnages et sprites |

## Workflow de developpement

```
1. DEMANDE utilisateur
       ↓
2. ANALYSE - Identifier les specs a modifier
       ↓
3. UPDATE SPECS - Mettre a jour la documentation
       ↓
4. VALIDATION - Demander confirmation
       ↓
5. IMPLEMENTATION - Coder la fonctionnalite
       ↓
6. TESTS - Verifier que tout fonctionne
       ↓
7. RESUME - Recapituler ce qui a ete fait
```

## Conventions

### Code
- Pure JS/CSS (pas de framework)
- Composants modulaires et reutilisables
- Commentaires en francais

### Specs
- **Ne jamais coder sans avoir mis a jour les specs d'abord**
- Les specs sont la source de verite du projet

## Comportement

1. **Lis d'abord** les guides dans `.config-claude/guides/`
2. **Applique** les regles de coding lors de review/creation de code
3. **Verifie** les versions reelles avant de repondre
4. **Met a jour** les specs avant d'implementer

---

**Mode Agent Vision active**
