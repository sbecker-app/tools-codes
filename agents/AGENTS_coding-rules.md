# Règles de Coding - Agent ML

## Fichiers de règles

Les règles de coding sont définies dans `/Users/frx33355/Documents/dev/mcp/docs/` :

| Fichier | Description |
|---------|-------------|
| `RULES_testing.md` | Règles pour les tests (expect groupés, Given-When-Then, helpers) |

## Règles principales

### Testing

1. **Pas de multi-expect séparés** - Grouper en un seul `expect({...}).toEqual({...})` pour avoir la stack trace complète
2. **Objets nommés** - Nommer les propriétés pour des messages d'erreur explicites
3. **Structure Given-When-Then** - Commentaires `// GIVEN`, `// WHEN`, `// THEN`
4. **Helpers réutilisables** - Créer des fonctions `expectApiError()` etc.

### Exemple rapide

```typescript
// ❌ Mauvais
expect(result.isOk()).toBe(true);
expect(repo.hasActiveUnits).toHaveBeenCalledWith(mandateId);

// ✅ Bon
expect({
  isOk: result.isOk(),
  calledWith: repo.hasActiveUnits.mock.calls,
}).toEqual({
  isOk: true,
  calledWith: [[mandateId]],
});
```

---

## MongoDB Aggregation - Performance

### Règle critique

**Chaque pipeline d'aggregation MongoDB doit être analysé pour les problèmes de performance.**

### Red flags à détecter

| Pattern | Problème | Alternative |
|---------|----------|-------------|
| `$lookup` avec `$expr` + `$in` | Ne peut pas utiliser les index | Dénormaliser ou calculer côté application |
| `$lookup` dans une lecture fréquente | Exécuté à chaque requête | Lazy evaluation (à la sauvegarde uniquement) |
| `$lookup` sans `$limit` dans le subpipeline | Charge toutes les docs | Ajouter `$limit: 1` si possible |
| `$match` après `$lookup` | Filtre après le join coûteux | Déplacer `$match` avant |
| `new Date()` dans aggregation | Recalculé à chaque exécution | Passer en paramètre |

### Exemple anti-pattern (PROD-28299)

```typescript
// ❌ ANTI-PATTERN - Timeout en production
{
  $lookup: {
    from: "units",
    let: { unitIds: "$units.unit" },
    pipeline: [
      { $match: { $expr: { $in: ["$_id", "$$unitIds"] } } },  // $in + $expr = scan complet
    ],
    as: "unitsWithEndDates",
  },
}
```

### Alternatives recommandées

1. **Frontend-only** - Calculer côté client si les données sont déjà disponibles
2. **Lazy evaluation** - Valider à la sauvegarde, pas à la lecture
3. **Dénormalisation** - Stocker le champ calculé et mettre à jour via hooks
4. **Index optimisé** - Si `$lookup` nécessaire, s'assurer que les champs sont indexés

### Action agent

**Lors de review de code avec aggregation MongoDB :**
1. Scanner pour les patterns ci-dessus
2. **ALERTER** si `$lookup` avec `$expr` ou `$in` détecté
3. Proposer une alternative performante
4. Vérifier l'existence d'index sur les champs de jointure

---

## 🚨 Alerte Performance Obligatoire

### Règle CRITIQUE

**Quand je propose une solution potentiellement peu performante, je DOIS :**

1. **Afficher un encart d'alerte visible** avant de proposer le code
2. **Demander validation explicite** à l'utilisateur
3. **Proposer une alternative** performante

### Format d'alerte à utiliser

```
> ⚠️ **ALERTE PERFORMANCE** ⚠️
>
> La solution proposée utilise un pattern potentiellement coûteux :
> - `$lookup` avec `$expr` + `$in` (ne peut pas utiliser les index)
> - [autre pattern problématique]
>
> **Impact potentiel :** Timeout en production sur des collections volumineuses
>
> **Alternative recommandée :** [description]
>
> **Souhaitez-vous continuer avec cette approche ou préférez-vous l'alternative ?**
```

### Patterns nécessitant une alerte

| Pattern | Risque |
|---------|--------|
| `$lookup` + `$expr` + `$in` | Scan complet de collection |
| `$lookup` sans index | O(n*m) au lieu de O(n*log(m)) |
| Aggregation dans une boucle | Multiplicité des requêtes |
| `new Date()` dans aggregation | Non-déterministe, cache impossible |
| `$unwind` sans `$limit` préalable | Explosion mémoire |

### Exemple de mise en œuvre

**❌ INTERDIT - Proposer directement :**
```typescript
// Voici le code...
$lookup: { pipeline: [{ $match: { $expr: { $in: ... } } }] }
```

**✅ OBLIGATOIRE - Alerter d'abord :**
```
> ⚠️ **ALERTE PERFORMANCE** ⚠️
>
> Ce `$lookup` avec `$expr` + `$in` ne peut pas utiliser les index MongoDB.
> Sur la collection `units` (~500k docs), cela causera des timeouts.
>
> **Alternative :** Faire un `findOne` séparé après l'aggregation.
>
> **Voulez-vous que j'utilise l'alternative performante ?**
```

---

## Usage

Lors de la review ou création de tests, appliquer automatiquement ces règles.
Lors de la review de code MongoDB, **alerter proactivement** sur les problèmes de performance.
**Toujours demander validation** avant de proposer du code potentiellement non-performant.
