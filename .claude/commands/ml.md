# Agent ML - Contexte Millenium

Tu es maintenant en mode **Agent ML** pour travailler sur le monorepo Millenium.

## 📖 Source de vérité

**IMPORTANT** : Lis immédiatement le fichier suivant qui contient TOUTES les instructions et le contexte pour le monorepo Millenium :

```
/Users/frx33355/Documents/dev/millenium/CLAUDE.md
```

Ce fichier est la **source de vérité** principale pour l'agent ML.

## 📋 Configuration additionnelle de l'agent MCP

En complément du CLAUDE.md principal, consulte également :
- `/Users/frx33355/Documents/dev/mcp/agents/AGENTS_mcp-routing.md` - Règles de routage MCP contextuel
- `/Users/frx33355/Documents/dev/mcp/agents/AGENTS_doc-fetching.md` - Stratégie de recherche documentaire
- `/Users/frx33355/Documents/dev/mcp/agents/AGENTS_context-db.md` - **Gestion du contexte via SQLite**

## 🧭 Comportement

1. **Lis d'abord** `/Users/frx33355/Documents/dev/millenium/CLAUDE.md`
2. **Applique** les règles de routage MCP depuis `agents/AGENTS_mcp-routing.md`
3. **Vérifie** les versions réelles avant de répondre
4. **Cherche** la documentation localement d'abord

## 🎫 Gestion des sujets / tickets PROD

Quand on parle d'un sujet ou ticket PROD :

1. **Interroger SQLite d'abord** (économie de tokens) :
   ```bash
   sqlite3 /Users/frx33355/Documents/dev/mcp/data/markdown.db \
     "SELECT file_path, json_extract(metadata, '$.title'), json_extract(metadata, '$.status') FROM files WHERE json_extract(metadata, '$.ticket') = 'PROD-XXXXX'"
   ```
2. **Charger le fichier MD** seulement si nécessaire pour travailler dessus
3. **Lire le ticket Jira** : `PROD-XXXXX` via l'outil Atlassian
4. **Chercher la ou les MRs associées** : dans GitLab ou liens du ticket
5. **Consulter l'historique** : commentaires, transitions, pièces jointes

### Sauvegarde et ré-indexation automatique

**RÈGLE** : Quand l'utilisateur demande de "sauvegarder", "enregistrer" ou "mettre à jour" un contexte/ticket dans `docs/*.md` :

1. Écrire/modifier le fichier avec frontmatter YAML
2. **Toujours** ré-indexer automatiquement après :
   ```bash
   cd /Users/frx33355/Documents/dev/mcp && npx mddb ./docs && mv markdown.db data/
   ```
3. Confirmer que l'indexation est faite

## ⚡ Commande PDATA

```bash
pnpm nx run plato:pdata-runner <chemin-relatif-du-script>
```

---

**Mode Agent ML activé** 🤖
