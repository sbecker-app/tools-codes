# 🗄️ Gestion du contexte via SQLite (MarkdownDB)

## Base de données

**Chemin** : `/Users/frx33355/Documents/dev/mcp/data/markdown.db`

## Workflow pour les tickets PROD

### 1. Lister les tickets (TOUJOURS commencer par ça)

```bash
sqlite3 /Users/frx33355/Documents/dev/mcp/data/markdown.db \
  "SELECT json_extract(metadata, '$.ticket') as ticket, json_extract(metadata, '$.title') as title, json_extract(metadata, '$.status') as status FROM files WHERE json_extract(metadata, '$.ticket') IS NOT NULL"
```

### 2. Chercher par tag

```bash
sqlite3 /Users/frx33355/Documents/dev/mcp/data/markdown.db \
  "SELECT file_path FROM files WHERE metadata LIKE '%pdata%'"
```

### 3. Charger un fichier spécifique (seulement si nécessaire)

```bash
# Uniquement après avoir identifié le bon fichier via SQLite
cat /Users/frx33355/Documents/dev/mcp/docs/PROD-XXXXX.md
```

## Règles d'utilisation

1. **NE JAMAIS charger tous les fichiers `docs/*.md`** au début d'une conversation
2. **TOUJOURS interroger SQLite d'abord** pour identifier le contexte pertinent
3. **Charger un fichier complet** uniquement quand l'utilisateur travaille dessus
4. **Mettre à jour le frontmatter** quand le status d'un ticket change

## Requêtes utiles

```sql
-- Tickets en cours
SELECT * FROM files WHERE json_extract(metadata, '$.status') = 'en_cours';

-- Tickets par domaine
SELECT * FROM files WHERE json_extract(metadata, '$.domain') = 'gl';

-- Recherche full-text dans les tags
SELECT file_path FROM files WHERE metadata LIKE '%caf%';

-- Tickets avec tâches non terminées
SELECT file_path, json_extract(metadata, '$.ticket') FROM files
WHERE json_extract(metadata, '$.status') = 'en_cours';
```

## Ré-indexation

Après modification d'un fichier markdown :

```bash
cd /Users/frx33355/Documents/dev/mcp && npx mddb ./docs && mv markdown.db data/
```

## Structure frontmatter attendue

```yaml
---
ticket: PROD-XXXXX           # ID Jira
title: Titre court           # Description
status: en_cours|resolu|bloque|annexe
domain: gl|accounting|tech   # Domaine métier
team: amarillo|autre         # Équipe (optionnel)
tags: [tag1, tag2]           # Pour recherche
assignee: Nom                # Assigné (optionnel)
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```
