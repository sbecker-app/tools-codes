# OpenSpec - Workflow de Developpement Spec-First

## Regle Principale

**AVANT de proposer une solution de developpement, utilise OpenSpec pour structurer ta proposition.**

## Quand utiliser OpenSpec

Utilise OpenSpec pour toute proposition impliquant:
- Nouvelles fonctionnalites
- Changements breaking d'API/schema
- Modifications d'architecture ou de patterns
- Mises a jour de strategie performance/securite

## Workflow en 3 phases

### Phase 1: Creer une proposition (Create Change)
1. Generer un `change-id` unique (kebab-case: `add-`, `update-`, `remove-`, `refactor-`)
2. Creer les fichiers:
   - `proposal.md` - Description et justification
   - `tasks.md` - Liste des taches a executer
   - `design.md` - Approche technique (optionnel)
3. Ecrire les specs delta avec `## ADDED Requirements` ou `## MODIFIED Requirements`
4. Valider avec `openspec validate <id> --strict`
5. **Attendre l'approbation avant l'implementation**

### Phase 2: Implementer (Implement Change)
- Lire dans l'ordre: `proposal.md` -> `design.md` -> `tasks.md`
- Executer les taches strictement dans l'ordre
- Cocher chaque item au fur et a mesure

### Phase 3: Archiver (Archive Change)
- Deplacer vers `changes/archive/YYYY-MM-DD-[id]/`
- Mettre a jour `openspec/specs/` si le comportement a change
- Executer `openspec validate --strict`

## Structure des dossiers

```
openspec/
├── specs/              # Specifications actuelles (source de verite)
│   └── [domain]/
│       └── spec.md
├── changes/            # Propositions de changements (travail en cours)
│   └── [feature-name]/
│       ├── proposal.md
│       ├── tasks.md
│       ├── design.md   (optionnel)
│       └── specs/
├── project.md          # Conventions & guidelines du projet
├── AGENTS.md           # Instructions pour les outils IA
└── archive/            # Changements completes
```

## Commandes CLI

| Commande | Description |
|----------|-------------|
| `openspec list` | Voir les dossiers de changements actifs |
| `openspec view` | Dashboard interactif des specs et changements |
| `openspec show <change>` | Afficher proposal, tasks, spec updates |
| `openspec validate <change> --strict` | Verifier le format et la structure |
| `openspec archive <change> --yes` | Archiver un changement complete |
| `openspec update` | Regenerer les instructions agent |

## Slash Commands Claude Code

- `/openspec:proposal` - Creer une nouvelle proposition
- `/openspec:apply` - Appliquer les changements apres approbation
- `/openspec:archive` - Archiver un changement complete

## Format des Specifications

```markdown
### Requirement: [Titre]
[Description de ce que le systeme DOIT faire]

#### Scenario: [Nom du scenario]
- **WHEN** [condition]
- **THEN** [resultat attendu]
```

## Exceptions (edition directe autorisee)

- Bug fixes restaurant le comportement prevu
- Corrections de texte, formatage, commentaires
- Mises a jour de dependances non-breaking
- Changements de configuration mineurs
- Tests couvrant le comportement existant

## Installation

```bash
npm install -g @fission-ai/openspec@latest
openspec init  # Dans le repertoire du projet
```

## References

- [GitHub - Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)
- [OpenSpec + Claude Code Workflow](https://www.vibesparking.com/en/blog/ai/openspec/2025-10-17-openspec-claude-code-dev-process/)
