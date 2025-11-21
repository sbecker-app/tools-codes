# 🔧 Parse CAF to MongoDB - Documentation

> Script de parsing de fichiers CAF vers format MongoDB FilesCAF

---

## 📄 Description

Le script **`parse-caf-to-mongodb.js`** parse un fichier CAF (format texte positions fixes) et génère un document MongoDB prêt pour insertion dans la collection `filesCAF` de Millenium.

**Emplacement** : `/Users/frx33355/Documents/dev/mcp/scripts/parse-caf-to-mongodb.js`

---

## 🚀 Usage

### Syntaxe

```bash
node parse-caf-to-mongodb.js <fichier-caf.txt> [agency-id]
```

### Arguments

| Argument | Type | Requis | Description |
|----------|------|---------|-------------|
| `fichier-caf.txt` | string | ✅ | Chemin vers le fichier CAF à parser |
| `agency-id` | string | ❌ | ObjectId MongoDB de l'agence |

### Exemples

```bash
# Sans agence (status = ERROR_AMOUNT)
node parse-caf-to-mongodb.js /Users/frx33355/Downloads/CAFAL841_2025103090710_0601.txt

# Avec agence (status = TO_HANDLE si cohérent)
node parse-caf-to-mongodb.js /Users/frx33355/Downloads/CAFAL841_2025103090710_0601.txt 507f1f77bcf86cd799439011
```

---

## 📤 Outputs générés

Pour chaque fichier CAF parsé, le script génère **2 fichiers** :

### 1. `<fichier>-mongodb.json`

Document MongoDB au format `FilesCAF`, prêt pour insertion.

**Exemple** : `CAFAL841_2025103090710_0601-mongodb.json`

```json
{
  "agency": "507f1f77bcf86cd799439011",
  "department": "84",
  "amount": {
    "value": 146100,
    "currency": "EUR"
  },
  "year": 2025,
  "month": 11,
  "type": "APL",
  "status": "TO_HANDLE",
  "statusHistory": [...],
  "cafTransfers": [...],
  "createdAt": "2025-11-20T13:46:34.786Z",
  "updatedAt": "2025-11-20T13:46:34.786Z",
  "__v": 0
}
```

### 2. `<fichier>-insert.js`

Script d'insertion MongoDB avec commentaires et vérifications.

**Exemple** : `CAFAL841_2025103090710_0601-insert.js`

```javascript
// Insertion document FilesCAF
// Fichier source: CAFAL841_2025103090710_0601.txt
// Code bailleur: P8456
// Montant total: 1461.00 €
// Nombre de transfers: 6
// Cohérence: OK

db.filesCAF.insertOne({...});

// Vérification après insertion
db.filesCAF.findOne({...}).pretty();
```

---

## 📋 Format du document MongoDB

### Structure complète

```typescript
{
  agency: ObjectId | null,        // Référence Agency
  department: string,             // Code département (ex: "84")
  amount: {
    value: number,                // En centimes !
    currency: "EUR"
  },
  year: number,                   // Année du fichier (ex: 2025)
  month: number,                  // Mois du fichier (1-12)
  type: "AL" | "APL",            // Type d'aide
  status: "TO_HANDLE" | "ERROR_AMOUNT",
  statusHistory: [{
    startDate: Date,
    endDate: Date,
    status: string
  }],
  cafTransfers: [{
    codeCAF: string,              // Code allocataire (15 caractères)
    name: string,
    firstName: string,
    month: number,                // Mois période aide
    year: number,                 // Année période aide
    amount: {
      value: number,              // En centimes ! (peut être négatif)
      currency: "EUR"
    },
    status: "TO_ENTER_ACCOUNTING"
  }],
  createdAt: Date,
  updatedAt: Date,
  __v: 0
}
```

### Champs importants

| Champ | Format | Description |
|-------|--------|-------------|
| `agency` | ObjectId ou `null` | Si `null` → status = `ERROR_AMOUNT` |
| `amount.value` | number (centimes) | Total du fichier CAF |
| `cafTransfers[].amount.value` | number (centimes) | Peut être **négatif** pour les retenues |
| `status` | enum | `TO_HANDLE` si OK, sinon `ERROR_AMOUNT` |

---

## ✅ Fonctionnalités

- ✅ **Parse format positions fixes** (compatible code Millenium)
- ✅ **Gère les montants positifs** et retenues (négatifs)
- ✅ **Validation cohérence** montants (total = somme lignes)
- ✅ **Calcul automatique du status**
- ✅ **Génération statusHistory** avec dates
- ✅ **Format MongoDB exact** (collection FilesCAF)
- ✅ **Script d'insertion** prêt à l'emploi
- ✅ **Logs détaillés** pendant le parsing
- ✅ **Gestion d'erreurs** complète

---

## 🔄 Workflow d'utilisation

### Étape 1 : Parser le fichier CAF

```bash
node parse-caf-to-mongodb.js fichier.txt
```

**Output** :
```
⚠️  Status: ERROR_AMOUNT (agence non fournie)

1️⃣  Rechercher l'agence dans MongoDB:
   db.agencies.findOne({ codeLessor: { $in: ["P8456"] } })
```

### Étape 2 : Récupérer l'ObjectId de l'agence

```bash
mongosh millenium --eval 'db.agencies.findOne({ codeLessor: { $in: ["P8456"] } }, { _id: 1 })'
```

**Output** :
```json
{ "_id": ObjectId("507f1f77bcf86cd799439011") }
```

### Étape 3 : Re-parser avec l'agence

```bash
node parse-caf-to-mongodb.js fichier.txt 507f1f77bcf86cd799439011
```

**Output** :
```
✅ Status: TO_HANDLE
✅ Document MongoDB: fichier-mongodb.json
✅ Script d'insertion: fichier-insert.js
```

### Étape 4 : Vérifier le document généré

```bash
cat fichier-mongodb.json
```

### Étape 5 : Insérer dans MongoDB

**Option 1 - Via script** :
```bash
mongosh millenium < fichier-insert.js
```

**Option 2 - Interactif** :
```bash
mongosh millenium
use millenium
load("fichier-insert.js")
```

### Étape 6 : Vérifier l'insertion

```bash
mongosh millenium --eval 'db.filesCAF.findOne({
  department: "84",
  month: 11,
  year: 2025
}).pretty()'
```

---

## ⚠️ Cas particuliers

### Montants en centimes

Les montants dans le fichier CAF sont **en centimes**. Le script conserve ce format (cohérent avec Millenium).

**Exemple** :
- Fichier CAF : `0000001780` → 178,00 €
- MongoDB : `{ value: 17800, currency: "EUR" }`

### Retenues (montants négatifs)

Les retenues sont converties en **montants négatifs** dans `cafTransfers`.

**Exemple** :
- Fichier CAF : Retenue `0000001625` (16,25 €)
- MongoDB : `{ value: -1625, currency: "EUR" }`

**Ligne du fichier CAF** :
```
Position 91-102 : Montant
Position 102-113 : Retenue

0602...0000002187500000001625000
        ^^^^^^^^^^^      ^^^^^^^^^^^
        Montant          Retenue
        21,875 €         16,25 €
```

**Documents MongoDB générés** :
```json
// Transfer 1 : Montant positif
{
  "amount": { "value": 21875, "currency": "EUR" }
}

// Transfer 2 : Retenue (négatif)
{
  "amount": { "value": -1625, "currency": "EUR" }
}
```

### Agence manquante

Si `agency-id` non fourni :
- Status → `ERROR_AMOUNT`
- Document créé mais non insérable tel quel
- Il faut re-parser avec l'agence

### Incohérence montants

Si total fichier ≠ somme des lignes :
- Status → `ERROR_AMOUNT`
- Log : `Coherence: ❌`
- Vérifier le fichier CAF source

---

## 📊 Tests effectués

### Test 1 : Fichier APL sans retenue

**Fichier** : `CAF841_2025110790626_0601.txt`

```bash
node parse-caf-to-mongodb.js CAF841_2025110790626_0601.txt 507f1f77bcf86cd799439011
```

**Résultats** :
- Type: APL
- Département: 84
- 6 transfers
- Montant: 1 461,00 €
- Cohérence: ✅ OK
- Status: `TO_HANDLE`

### Test 2 : Fichier AL avec retenues

**Fichier** : `CAFAL301_2025103090703_0601.txt`

```bash
node parse-caf-to-mongodb.js CAFAL301_2025103090703_0601.txt 507f1f77bcf86cd799439011
```

**Résultats** :
- Type: AL
- Département: 30
- 63 transfers (dont 1 retenue négative)
- Montant: 13 557,75 €
- Cohérence: ✅ OK
- Status: `TO_HANDLE`
- Retenue trouvée : `-16,25 €`

---

## 🐛 Debugging

### Vérifier la cohérence des montants

Le script affiche automatiquement :

```
Total amount: 146100 centimes (1461.00 €)
Coherence: ✅ (total: 146100, sum: 146100)
```

### Logs détaillés

Le script affiche :
- Nombre de lignes par type (emitter, detail, total)
- Type, département, période
- Code bailleur
- Nombre de transfers
- Validation cohérence
- Status final

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `File not found` | Chemin incorrect | Vérifier le chemin du fichier |
| `No emitter line found` | Fichier corrompu | Vérifier format du fichier |
| `Unknown type code` | Type non reconnu | Vérifier ligne 0302 |
| `Coherence: ❌` | Total ≠ somme | Contacter CAF |

---

## 🔗 Liens utiles

### Documentation
- [Processus d'intégration CAF (Mermaid)](./process-integration-caf-recap.md)
- [Documentation technique CAF](./integration-fichiers-caf.md)
- [README global CAF](./README-CAF.md)

### Scripts
- **Ce script** : `/scripts/parse-caf-to-mongodb.js`
- Script JSON : `/scripts/parse-caf-to-json.js`
- Script résumé : `/scripts/parse-caf-files.js`

### Code source Millenium
- Parser CAF : `/applications/plato/src/flux/caf/cafFiles.process.js`
- Constantes : `/applications/plato/constants/accounting/filesCAF.ts`
- Process income : `/applications/plato/src/routes/accounting/rentalManagement/caf/income/income.process.js`

---

## 📝 Notes

### Différence avec le parser Millenium

Ce script reproduit **exactement** la logique du parser Millenium (`cafFiles.process.js`) :
- ✅ Mêmes positions de champs
- ✅ Même gestion montants/retenues
- ✅ Même validation cohérence
- ✅ Même format de sortie MongoDB

**Différences** :
- ❌ Pas de récupération automatique agence (mapping `codeLessor` → `agency`)
- ❌ Pas d'insertion automatique dans MongoDB
- ✅ Génère fichiers pour inspection manuelle
- ✅ Script d'insertion avec vérifications

### Utilisation recommandée

**Production** : Utiliser le processus automatique Millenium (SFTP → Scheduled Task)

**Debug / Test** : Utiliser ce script pour :
- Parser un fichier localement
- Vérifier la structure avant insertion
- Tester avec différentes agences
- Débugger des incohérences

---

**Dernière mise à jour** : 2025-11-20
**Version** : 1.0
