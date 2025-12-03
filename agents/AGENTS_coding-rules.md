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

## Usage

Lors de la review ou création de tests, appliquer automatiquement ces règles.
