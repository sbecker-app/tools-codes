# 🔧 PDATA - Intégration fichier CAF local

> Script PDATA pour intégrer un fichier CAF depuis le filesystem local

---

## 📄 Description

Ce script PDATA permet d'intégrer un fichier CAF directement depuis le filesystem local, en **bypassant le processus SFTP/S3 habituel**.

**Fichier** : `/applications/plato/scripts/pdata/2025-11/CAF-INTEGRATION-LOCAL.ts`

### Utilité

- ✅ **Tester l'intégration** d'un fichier CAF avant de le déposer sur SFTP
- ✅ **Réintégrer un fichier** qui a échoué dans le processus automatique
- ✅ **Debugger** le parsing d'un fichier problématique
- ✅ **Intégration manuelle** en cas de problème SFTP/S3

### Différence avec le processus automatique

| Aspect | Process automatique | PDATA |
|--------|---------------------|-------|
| Source fichier | SFTP → S3 | Filesystem local |
| Déclenchement | Scheduled task | Manuel |
| SftpIncomingFile | Créé | ❌ Non créé |
| FilesCAF | Créé | ✅ Créé |
| Logique parsing | cafFiles.process.js | ✅ Identique |

---

## 🚀 Usage

### 1. Configurer le script

Éditer le fichier `/applications/plato/scripts/pdata/2025-11/CAF-INTEGRATION-LOCAL.ts`

```typescript
// ============================================================================
// CONFIGURATION - À MODIFIER SELON VOS BESOINS
// ============================================================================

/**
 * Chemin absolu vers le fichier CAF à intégrer
 */
const FILE_PATH = "/Users/frx33355/Downloads/CAFAL841_2025103090710_0601.txt";

/**
 * ObjectId de l'agence (optionnel)
 * Si non fourni, sera récupéré automatiquement via le mapping codeLessor → Agency
 */
const AGENCY_ID: string | null = null; // Ou "507f1f77bcf86cd799439011"

/**
 * Mode dry-run : Si true, ne crée pas le document dans MongoDB
 */
const DRY_RUN = false; // true pour tester sans créer
```

### 2. Exécuter le script

**Option A - Dry run (recommandé pour test)** :

```bash
# 1. Activer le dry run dans le fichier
DRY_RUN = true

# 2. Exécuter
cd /Users/frx33355/Documents/dev/millenium/applications/plato
pnpm pdata 2025-11/CAF-INTEGRATION-LOCAL
```

**Option B - Intégration réelle** :

```bash
# 1. Désactiver le dry run
DRY_RUN = false

# 2. Exécuter
pnpm pdata 2025-11/CAF-INTEGRATION-LOCAL
```

---

## 📋 Étapes du script

### 1️⃣ Lecture du fichier

```typescript
const fileContent = readFileSync(FILE_PATH, "utf-8");
```

- Lit le fichier CAF depuis le path local
- Erreur si fichier introuvable

### 2️⃣ Parsing du fichier

**Logique identique** à `/applications/plato/src/flux/caf/cafFiles.process.js`

- Split par lignes (`\r\n`)
- Extraction des enregistrements :
  - `0302` : Émetteurs (headers)
  - `0602` : Détails (versements)
  - `0802` : Totaux
- Mapping des champs selon positions fixes
- Création des `cafTransfers`

### 3️⃣ Validation cohérence

```typescript
const dataCoherent = checkDataCoherence(fileCAFMapped);
```

- Vérifie que `total = somme des versements positifs`
- Si incohérent → log warning, status `ERROR_AMOUNT`

### 4️⃣ Récupération agence

**Si AGENCY_ID fourni** :
```typescript
agencyId = new ObjectId(AGENCY_ID);
```

**Sinon, mapping automatique** :
```typescript
agencyId = await AgencyDao.getAgencyIdFromCodeLessor(codeLessorCAF);
```

### 5️⃣ Vérification doublon

```typescript
const existingFileCAF = await FilesCAFModel.findOne({
  agency, department, year, month, type
});
```

- ⚠️ **Erreur 409** si un document existe déjà avec cette combinaison
- Empêche la création de doublons

### 6️⃣ Création du document

**En dry-run** :
```
✅ DRY RUN completed - no changes made to database
```

**En mode réel** :
```typescript
const created = await FilesCAFModel.create(fileCAFData);
```

---

## 📊 Outputs

### Logs de succès

```
[CAF-INTEGRATION-LOCAL] Starting CAF file integration from local path
[CAF-INTEGRATION-LOCAL] File path: /Users/.../CAFAL841_2025103090710_0601.txt
[CAF-INTEGRATION-LOCAL] Dry run: false
[CAF-INTEGRATION-LOCAL] File read successfully
Parsing CAF file content...
{ emitters: 6, details: 659, totals: 6 }
{ totalAmount: 16639251, amountVersementsCAF: 16639251, dataCoherent: true }
{ agencyId: '507f1f77bcf86cd799439011' } 'Agency ID retrieved'
[CAF-INTEGRATION-LOCAL] Document prepared {
  status: 'TO_HANDLE',
  agency: '507f1f77bcf86cd799439011',
  amountEur: 166392.51
}
[CAF-INTEGRATION-LOCAL] ✅ FilesCAF document created successfully {
  _id: '673de1234567890abcdef123',
  status: 'TO_HANDLE',
  agency: '507f1f77bcf86cd799439011',
  department: '84',
  type: 'AL',
  year: 2025,
  month: 10,
  amountEur: 166392.51,
  transfersCount: 659
}
```

### Logs d'erreur - Doublon détecté

```
[CAF-INTEGRATION-LOCAL] ⚠️  A FilesCAF document already exists for this combination!
[CAF-INTEGRATION-LOCAL] Agency: 507f1f77bcf86cd799439011, Dept: 84, Type: AL, Period: 10/2025

CommonException: FilesCAF document already exists - aborting to prevent duplicates
  statusCode: 409
  data: {
    existingId: '673de1111111111111111111',
    existingStatus: 'TO_HANDLE'
  }
```

### Logs d'erreur - Incohérence montants

```
{ totalAmount: 146100, amountVersementsCAF: 140000, dataCoherent: false }
[CAF-INTEGRATION-LOCAL] Data coherence check failed - will create with ERROR_AMOUNT status
[CAF-INTEGRATION-LOCAL] Document prepared {
  status: 'ERROR_AMOUNT',
  ...
}
```

---

## ⚠️ Cas particuliers

### Fichier sans agence connue

**Scénario** : Code bailleur `P9999` non mappé dans `agencies.codeLessor`

```
[CAF-INTEGRATION-LOCAL] { codeLessor: [ 'P9999' ] } 'Agency not found for codeLessor'
[CAF-INTEGRATION-LOCAL] Document prepared {
  status: 'ERROR_AMOUNT',
  agency: null,
  ...
}
```

**Solution** :
1. Ajouter le mapping dans MongoDB :
   ```javascript
   db.agencies.updateOne(
     { _id: ObjectId("...") },
     { $addToSet: { codeLessor: "P9999" } }
   )
   ```
2. Ou fournir `AGENCY_ID` manuellement dans le script

### Fichier déjà intégré

**Scénario** : Document existe déjà avec même `(agency, department, year, month, type)`

```
CommonException: FilesCAF document already exists - aborting to prevent duplicates
```

**Solutions** :
1. Vérifier si le document existant est correct
2. Supprimer le doublon si nécessaire :
   ```javascript
   db.filesCAF.deleteOne({ _id: ObjectId("...") })
   ```
3. Re-exécuter le pdata

### Fichier avec retenues

**Fonctionnement** : Les retenues sont converties en montants négatifs

**Exemple ligne fichier** :
```
Position 91-102  : 0000002187500 (21,875 €)
Position 102-113 : 0000001625000 (16,25 €)
```

**Résultat** :
```json
[
  { "codeCAF": "...", "amount": { "value": 21875 } },
  { "codeCAF": "...", "amount": { "value": -1625 } }
]
```

---

## 🔍 Vérification après intégration

### 1. Vérifier le document créé

```javascript
db.filesCAF.findOne({ _id: ObjectId("673de1234567890abcdef123") }).pretty()
```

### 2. Compter les transfers

```javascript
db.filesCAF.aggregate([
  { $match: { _id: ObjectId("673de1234567890abcdef123") } },
  { $project: {
      transfersCount: { $size: "$cafTransfers" },
      amountEur: { $divide: ["$amount.value", 100] }
  }}
])
```

### 3. Vérifier la cohérence

```javascript
db.filesCAF.aggregate([
  { $match: { _id: ObjectId("673de1234567890abcdef123") } },
  { $project: {
      totalFile: "$amount.value",
      totalLines: { $sum: "$cafTransfers.amount.value" },
      diff: {
        $subtract: [
          "$amount.value",
          { $sum: "$cafTransfers.amount.value" }
        ]
      }
  }}
])
```

---

## 🆚 Comparaison avec le process automatique

### Process automatique (SFTP → Scheduled Task)

**Flux** :
```
1. CAF → SFTP
2. Scanner SFTP → S3
3. SftpIncomingFile créé (status: READY)
4. processFilesCAFAL (scheduled task)
5. Parse fichier depuis S3
6. FilesCAF créé
7. SftpIncomingFile.status → SUCCESS
```

**Avantages** :
- ✅ Automatique
- ✅ Traçabilité complète (SftpIncomingFile)
- ✅ Gestion retry automatique

**Inconvénients** :
- ❌ Dépendance SFTP/S3
- ❌ Délai (attente scheduled task)
- ❌ Debugging difficile

### PDATA (fichier local)

**Flux** :
```
1. Fichier CAF local
2. PDATA exécuté manuellement
3. Parse fichier depuis filesystem
4. FilesCAF créé
```

**Avantages** :
- ✅ Contrôle total
- ✅ Exécution immédiate
- ✅ Debugging facile (dry-run)
- ✅ Pas de dépendance SFTP/S3

**Inconvénients** :
- ❌ Manuel
- ❌ Pas de SftpIncomingFile créé
- ❌ Moins de traçabilité

---

## 🎯 Cas d'usage recommandés

### ✅ Utiliser le PDATA si :

1. **Test d'intégration** avant déploiement en production
2. **Fichier bloqué** dans le process SFTP/S3
3. **Debug parsing** d'un fichier problématique
4. **Urgence** : besoin d'intégrer immédiatement
5. **Environnement local** : pas d'accès SFTP

### ❌ NE PAS utiliser le PDATA si :

1. Le process automatique fonctionne
2. Fichier déjà dans SFTP (risque doublon)
3. Production normale (privilégier l'automatisation)

---

## 🐛 Troubleshooting

### Erreur : File not found

```
CommonException: Failed to read file at /path/to/file.txt
```

**Solution** : Vérifier le chemin absolu du fichier

### Erreur : File mapping incomplete

```
CommonException: File mapping incomplete - missing required fields
```

**Causes possibles** :
- Fichier corrompu
- Format incorrect
- Enregistrement 0302 manquant

**Solution** : Vérifier le format du fichier CAF

### Erreur : Agency not found

```
{ codeLessor: [ 'P8456' ] } 'Agency not found for codeLessor'
```

**Solutions** :
1. Fournir `AGENCY_ID` manuellement
2. Ajouter le mapping codeLessor → Agency

### Warning : Data coherence check failed

```
{ totalAmount: 146100, amountVersementsCAF: 140000, dataCoherent: false }
```

**Impact** : Document créé avec `status: ERROR_AMOUNT`

**Solution** : Vérifier le fichier CAF source avec la CAF

---

## 📚 Voir aussi

- [Documentation process CAF](./process-integration-caf-recap.md)
- [Parser CAF → MongoDB](./README-parse-caf-mongodb.md)
- [Conventions PDATA](../../millenium/documentation/docs/conventions/Naming%20things/PData.md)

---

**Dernière mise à jour** : 2025-11-20
**Version** : 1.0
