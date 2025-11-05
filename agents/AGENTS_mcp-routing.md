# 🤖 AGENTS_MCP_ROUTING.md
> Résumé de routage MCP pour Codex  
> Configuration basée sur ton `config.toml` (2025-11-04)

---

## 🧭 Règles de routage contextuel

| Contexte / Domaine détecté | MCP cible | Transport | Auth | Description |
|-----------------------------|------------|------------|------|--------------|
| **https://fonciamillenium.atlassian.net/**<br>ou clé Jira (ex : `PROD-27785`) | `Atlassian-Remote` | SSE (via `mcp-remote`) | Sans login (`rmcp_client`) | Lecture / édition de tickets Jira, pages Confluence, commentaires, transitions, etc. |
| **https://github.com/** | `GitHub` | Local (`pnpm exec`) | N/A | Commandes Git locales : commits, branches, merges, logs, etc. |
| **https://www.notion.so/** ou doc interne Notion | `Notion` | Local (`npx`) | N/A | Lecture / écriture de pages, commentaires, requêtes Notion API. |
| **Documentation technique / dépendances** | `context7` | Local (`npx`) | N/A | Fournit la documentation des librairies et dépendances locales. |
| **Accès fichiers locaux** | `fs` | Local (`npx`) | N/A | Navigation et lecture/écriture de fichiers locaux autorisés. |
| **Commandes système (bash, pnpm, node)** | `shell` | Local (`node`) | N/A | Exécution de commandes shell dans un environnement contrôlé. |
| **Base MongoDB locale (dev)** | `mongodb` | Local (`npx`) | N/A | Accès et requêtes sur la base MongoDB via le MCP Mongo officiel. |
| **Tests end-to-end et UI (Playwright)** | `playwright` | Local (`npx`) | N/A | Lancement de tests e2e et captures automatisées. |

---

## 🧩 Notes de configuration

- `rmcp_client = true` activé → permet la communication avec MCP distants (Figma, Atlassian).
- Tous les MCP sont **déclarés trusted** (`trust_level = "trusted"`) pour les projets suivants :
    - `/Users/frx33355/Documents/dev/mcp`
    - `/Users/frx33355/Documents/dev/millenium`
- Figma nécessite un login initial :
  ```bash
  codex mcp login figma
