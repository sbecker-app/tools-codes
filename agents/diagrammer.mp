# AGENTS.md

## diagrammer

### Description
Parcourt récursivement un dossier (hors du repo courant si besoin), détecte les fichiers JS/TS/TSX, suit les imports/exports, construit un graphe de dépendances (modules/fichiers), et génère un diagramme **Mermaid** (`flowchart`/`graph`) sauvegardé sur disque.
le graph dependra du besoin exprimer et ne sera pas forcement un grzaph de dependence mais une logique exprimer dans le code

### Inputs
- **root** *(obligatoire)* : chemin du dossier à analyser (peut être absolu ou relatif au dossier courant).
- **output** *(optionnel, défaut: `MERMAID.md`)* : chemin du fichier de sortie (ex: `docs/deps.md` ou `docs/deps.mmd`).
- **direction** *(optionnel, défaut: `LR`)* : sens du diagramme (`LR`, `TB`).
- **include** *(optionnel)* : glob(s) à inclure (ex: `"src/**"`).
- **exclude** *(optionnel)* : glob(s) à exclure (ex: `"**/*.test.ts,**/__tests__/**,**/node_modules/**"`).
- **maxDepth** *(optionnel)* : profondeur max de suivi des imports (défaut: illimitée).
- **collapse** *(optionnel)* : `folder` pour regrouper par dossier, `none` pour afficher chaque fichier (défaut: `folder`).
- **format** *(optionnel)* : `flowchart` ou `graph` (défaut: `flowchart`).
- **title** *(optionnel)* : titre affiché en haut du fichier généré.

### Steps
1. **Lister les fichiers** dans `root` selon `include`/`exclude` avec `fs`.
2. **Parser les imports** :
    - Supporte `import ... from 'x'`, `export * from 'x'`, `require('x')`, `dynamic import('x')`.
    - Ignore les imports de **packages externes** (ex: `react`, `zod`) pour se concentrer sur les chemins relatifs/monorepo (`./`, `../`, `@scope/...` si résoluble).
3. **Résoudre les chemins** :
    - Résolution d’extensions (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.d.ts`) et d’index (`index.ts`).
    - Respect des alias tsconfig si un `tsconfig.json` est présent (via lecture et simple mapping `paths`).
4. **Construire le graphe** (nœuds=fichiers ou dossiers si `collapse=folder`, arêtes=imports).
5. **Générer le Mermaid** :
    - `flowchart LR|TB` ou `graph TD`.
    - Groupes par dossier avec `subgraph` si `collapse=folder`.
    - Noms de nœuds compacts (chemins relatifs à `root`).
6. **Écrire la sortie** dans `output` :
    - Fichier Markdown si extension `.md` avec un bloc ```mermaid
    - Fichier `.mmd` contenant uniquement le code Mermaid.
7. **Afficher** un résumé (nombre de fichiers scannés, arêtes, fichiers isolés).

### Output
Un fichier Mermaid prêt à coller dans un Markdown/Docs. Exemple de structure générée (extrait) :
\`\`\`mermaid
flowchart LR
subgraph src/utils
utils_index["utils/index.ts"]
date_ts["utils/date.ts"]
end
subgraph src/services
api_ts["services/api.ts"]
end

api_ts --> utils_index
utils_index --> date_ts
\`\`\`

### Tools
- **fs** : lire/écrire les fichiers et parcourir l’arborescence
- **shell** : optionnel (si besoin de `git ls-files` pour restreindre aux fichiers versionnés)
- **context7** : optionnel (lecture de `tsconfig.json`, `package.json`)
- **mermaid**


### Model
`gpt-5-codex`

### Notes
- Les imports externes (ex: `react`, `zod`) sont ignorés par défaut. Pour les inclure en tant que nœuds, préciser `includeExternal=true` (non activé par défaut).
- Si `tsconfig.json` contient des `paths`, l’agent tentera une résolution simple (best-effort).
- Si un fichier dépasse `maxDepth`, son exploration est tronquée mais reste dans le graphe.