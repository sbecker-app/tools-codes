# Projet ML - Millenium

Ressources et contexte pour l'agent Claude Code travaillant sur le monorepo **Millenium**.

## Structure

```
projects/ml/
├── .config-claude/
│   ├── system-prompt.md      # Profil principal
│   ├── mcp_settings.json
│   ├── settings.local.json
│   └── guides/               # Guides de configuration
│       ├── mcp-routing.md
│       ├── connection.md
│       ├── context-db.md
│       ├── local-bo.md
│       └── snowflake.md
├── data/
│   └── markdown.db
├── docs/
│   └── PROD-*.md
├── sessions/
└── README.md
```

## Commandes

| Commande          | Description |
|-------------------|-------------|
| `/ml`             | Activer l'agent ML |
| `/ml-status`      | Status du projet |
| `/ml-update-spec` | Mettre à jour les specs |
| `/ml-validate`    | Valider les changements |

## Lister les tickets

```bash
sqlite3 data/markdown.db \
  "SELECT json_extract(metadata, '$.ticket'), json_extract(metadata, '$.status') FROM files"
```

## Ré-indexer après modification

```bash
cd /Users/frx33355/Documents/dev/mcp/projects/ml && npx mddb ./prods && mv markdown.db data/
```

## Liens

- **Monorepo Millenium** : `/Users/frx33355/Documents/dev/millenium/`
- **Commande** : `.claude/commands/ml.md`
