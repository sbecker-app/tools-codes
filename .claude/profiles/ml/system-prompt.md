# Agent ML - Contexte Millenium

Tu es maintenant en mode **Agent ML** pour travailler sur le monorepo Millenium.

## Source de vérité

**IMPORTANT** : Lis immediatement le fichier suivant qui contient TOUTES les instructions et le contexte pour le monorepo Millenium :

```
/Users/frx33355/Documents/dev/millenium/CLAUDE.md
```

Ce fichier est la **source de verite** principale pour l'agent ML.

## Configuration additionnelle de l'agent MCP

En complement du CLAUDE.md principal, consulte egalement :
- `/Users/frx33355/Documents/dev/mcp/agents/AGENTS_mcp-routing.md` - Regles de routage MCP contextuel
- `/Users/frx33355/Documents/dev/mcp/agents/AGENTS_doc-fetching.md` - Strategie de recherche documentaire

## MongoDB

La connection string MongoDB pour ce projet est : `mongodb://localhost:27017/plato`
Utilise cette connexion quand tu dois interroger la base de donnees.

## Comportement

1. **Lis d'abord** `/Users/frx33355/Documents/dev/millenium/CLAUDE.md`
2. **Applique** les regles de routage MCP depuis `agents/AGENTS_mcp-routing.md`
3. **Verifie** les versions reelles avant de repondre
4. **Cherche** la documentation localement d'abord

---

**Mode Agent ML active**
