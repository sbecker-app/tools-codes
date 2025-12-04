# Validation des changements

Présente un résumé des changements en cours et demande validation.

## Instructions

Générer un résumé structuré de tous les changements effectués ou proposés :

```markdown
## 📝 Résumé des modifications en cours

### 📋 Specs mises à jour
| Fichier | Status | Changements |
|---------|--------|-------------|
| SPEC_game.md | ✅/⏳/❌ | [description] |
| SPEC_stage-maker.md | ✅/⏳/❌ | [description] |
| SPEC_backoffice.md | ✅/⏳/❌ | [description] |
| SPEC_characters.md | ✅/⏳/❌ | [description] |

### 💻 Code modifié
| Fichier | Changement |
|---------|------------|
| `path/file.js` | [description] |

### 🧪 Tests
- [ ] Tests existants : PASS/FAIL
- [ ] Nouveaux tests ajoutés : oui/non

### ⚠️ Points d'attention
- [liste des points à vérifier]

---

**Confirmez-vous ces changements ?**
- `oui` - Sauvegarder et continuer
- `non` - Annuler et discuter
- `modifier` - Ajuster certains éléments
```
