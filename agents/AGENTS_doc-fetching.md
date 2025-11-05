# 📚 Politique de récupération de documentation

Tu ne dois télécharger ou récupérer de la documentation externe **que dans le cadre d’une question de développement** (ex. code, API, SDK, build, CI, monorepo, Expo, React Native, pnpm, NestJS, GraphQL).

## 1. Sources possibles
- Si la doc est disponible dans **context7** → utiliser en priorité le MCP `context7`.
- Sinon, si la doc est dans les dépôts GitHub utilisés → utiliser le MCP `GitHub`.
- Sinon, ne pas inventer : expliquer que la source n’est pas disponible.

## 2. Vérification locale avant téléchargement
Avant de récupérer quoi que ce soit :
- Vérifie via le MCP `fs` si la doc de cet outil **à la bonne version** est déjà dans le dossier `docs/` (`$DOCS_DIR` ou `/Users/frx33355/Documents/dev/mcp/docs`).
- Si elle existe → ne pas re-télécharger.
- Si elle n'existe pas → la récupérer et l'enregistrer dans le dossier.

## 3. Gestion des versions
Toujours tenir compte de la **version réelle de l’outil** utilisée dans le projet (Expo SDK, pnpm, NestJS, React Native, etc.).
- Si connue → utiliser la bonne version.
- Si inconnue → le signaler et ne rien télécharger au hasard.

## 4. Cas où il ne faut rien télécharger
- Si la question **n’est pas technique / de développement**.
- Si la doc est déjà locale.
- Si la source n’est pas fiable ou accessible.

## 5. Emplacement cible
Enregistrer toute documentation récupérée dans `docs/` (`$DOCS_DIR` ou `/Users/frx33355/Documents/dev/mcp/docs`).

### 7. Exemple de comportement attendu

**Question utilisateur :**
> “Pourquoi mon `expo build` plante sur SDK 53 avec Metro ?”

**Comportement attendu :**
- Détecter que c'est une question de dev.
- Identifier Expo SDK 53 via `package.json`.
- Vérifier s'il existe `docs/expo_53.0.0.md`.
    - Si oui → lire depuis le fichier et répondre.
    - Si non → récupérer depuis GitHub `expo/expo@53.0.0` ou context7, puis stocker et répondre.

---

🧩 Ce module utilise les MCP suivants :
- `fs` → pour lire/écrire les fichiers locaux.
- `context7` → pour chercher de la documentation ou des connaissances internes.
- `GitHub` → pour récupérer les README, CHANGELOG, docs techniques officielles.