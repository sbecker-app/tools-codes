# 📋 Processus d'intégration des fichiers CAF

> Documentation du processus d'intégration des fichiers CAF/CAFAL (Caisse d'Allocations Familiales) dans Millenium
> Dernière mise à jour : 2025-11-20

---

## 🎯 Vue d'ensemble

Les fichiers CAF contiennent les versements d'aides au logement (AL/APL) effectués par la Caisse d'Allocations Familiales aux bailleurs. Ces fichiers doivent être intégrés dans Millenium pour :
- Créer les virements CAF vers les bénéficiaires (locataires)
- Enregistrer les écritures comptables correspondantes
- Suivre l'état des paiements

## 📁 Types de fichiers

### Nomenclature
```
[TYPE][DEPT]_[TIMESTAMP]_[BATCH].txt

Exemples :
- CAF841_2025110790626_0601.txt      → APL, département 84
- CAFAL301_2025103090703_0601.txt    → AL, département 30
- CAFAL841_2025103090710_0601.txt    → AL, département 84
```

### Types d'aides
- **AL** (Aide au Logement) - Code type `999`
- **APL** (Aide Personnalisée au Logement) - Code type `900`

---

## 🔄 Architecture du processus

### 1️⃣ **Réception des fichiers**

```
SFTP/S3 → SftpIncomingFile (MongoDB) → Scheduled Task
```

**Collection MongoDB** : `sftpIncomingFiles`
- Les fichiers sont déposés sur SFTP et scannés automatiquement
- Métadonnées stockées avec hash S3 pour récupération du contenu
- Status initial : `READY`

**Code source** :
- Scanner SFTP : `/applications/plato/src/flux/technical/scanSftp/`
- Configuration : `/applications/plato/src/flux/technical/scanSftp/scanS3.config.js`

---

### 2️⃣ **Traitement automatique (Scheduled Task)**

**Task** : `processFilesCAFAL`
- Fichier : `/applications/plato/src/jobs/schedulers/tasks/processFilesCAFAL.ts`
- Fréquence : Périodique (définie dans `scheduledTasks`)
- Processeur : `/applications/plato/src/flux/caf/cafFiles.process.js`

**Étapes du traitement** :
1. **Récupération des fichiers à traiter**
   - Status `READY` ou `PROCESSING`
   - Filtré par `processName = CAFAL_FILE`

2. **Extraction du contenu**
   - Récupération depuis S3 via hash
   - Conversion buffer → string

3. **Parsing du fichier**
   - Split par lignes (`\r\n`)
   - Identification des types d'enregistrements

4. **Validation et création**
   - Vérification cohérence des montants
   - Mapping bailleur → agence
   - Création document `FilesCAF`
   - Mise à jour status `SftpIncomingFile` → `SUCCESS`

---

## 📄 Structure des fichiers CAF

### Format : Fichier texte à positions fixes

#### Types d'enregistrements

| Préfixe | Type | Description |
|---------|------|-------------|
| `0302` | Émetteur | En-tête avec métadonnées (type, période, département) |
| `0602` | Détail | Ligne de versement par bénéficiaire |
| `0702` | Sous-total | Total intermédiaire (par lot) |
| `0802` | Total | Total général du fichier |

---

### 🔍 Enregistrement Émetteur (0302)

**Format** :
```
0302[TYPE][DEPT][CODE_LESSOR]...[MONTH][YEAR]...[LIBELLÉ]
```

**Champs extraits** :

| Champ | Positions | Description | Exemple |
|-------|-----------|-------------|---------|
| Type | 4-7 | Code type aide (999=AL, 900=APL) | `999` |
| Département | 7-9 | Code département | `84` |
| Code bailleur | 10-15 | Identifiant bailleur → mapping agence | `P8456` |
| Mois | 20-22 | Mois de versement | `11` |
| Année | 22-24 | Année (2 chiffres) | `25` → 2025 |

**Exemple** :
```
0302999841P8456   051125CAISSE D'ALLOCATIONS FAM...
     ^^^  ^^     ^^^^
     type dept   mois/an
```

---

### 💰 Enregistrement Détail (0602)

**Format** :
```
0602[TYPE][DEPT][CODE_LESSOR]...[CODE_CAF][NOM][PRÉNOM][AN][MOIS][MONTANT][RETENUE]
```

**Champs extraits** :

| Champ | Positions | Description | Format |
|-------|-----------|-------------|--------|
| Code CAF | 36-51 | Numéro allocataire (lien vers customer.codeCAF) | 15 caractères |
| Nom | 51-71 | Nom du bénéficiaire | 20 caractères |
| Prénom | 71-83 | Prénom du bénéficiaire | 12 caractères |
| Année | 83-85 | Année période aide | `25` |
| Mois | 85-87 | Mois période aide | `10` |
| Montant | 91-102 | Montant versé (en centimes) | `0000002860` = 28,60 € |
| Retenue | 102-113 | Montant retenu (en centimes) | `0000001625` = 16,25 € |

**Exemple** :
```
0602999301P8456   000000726118400000001422146LDE ALBERTIS    MEHDI      2510  0000002187500000001625000
                  ^^^^^^^^^^^^^^^^              ^^^^^^^^^^    ^^^^^^     ^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^
                  code CAF (15c)                nom (20c)     prénom(12c)année montant    retenue
                                                                          mois  (11c)      (11c)
```

**Important** :
- Les montants sont **en centimes** (diviser par 100)
- Une ligne peut avoir un montant > 0 ET une retenue > 0
- Montant négatif = retenue (sera enregistré comme ligne séparée)

---

### 📊 Enregistrement Total (0802)

**Format** :
```
0802[TYPE][DEPT][CODE_LESSOR]...[TOTAL_MONTANT][TOTAL_RETENUE]
```

**Champs extraits** :

| Champ | Positions | Description |
|-------|-----------|-------------|
| Total montant | 91-102 | Somme des versements (centimes) |
| Total retenue | 102-113 | Somme des retenues (centimes) |

---

## 🗄️ Modèle de données

### Collection `filesCAF`

```typescript
{
  _id: ObjectId,
  agency: ObjectId,              // Référence Agency (mappé via codeLessorCAF)
  department: String,            // Code département (ex: "84")
  amount: {                      // Montant total
    value: Number,               // En centimes
    currency: "EUR"
  },
  year: Number,                  // Ex: 2025
  month: Number,                 // 1-12
  type: "AL" | "APL",           // Type d'aide
  status: "TO_HANDLE" | "PROCESSED" | "ERROR_AMOUNT",
  statusHistory: [{
    startDate: Date,
    endDate: Date,
    status: String
  }],
  cafTransfers: [{               // Lignes de versement
    codeCAF: String,             // Code allocataire
    name: String,
    firstName: String,
    month: Number,
    year: Number,
    amount: { value: Number, currency: String },
    status: "TO_ENTER_ACCOUNTING" | "ACCOUNTING_ENTERED" | "ERROR_SUBSIDY_RECIPIENT_UNKNOWN"
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Status possibles** :
- `TO_HANDLE` : Fichier prêt à être traité (cohérence OK, agence trouvée)
- `PROCESSED` : Encaissements effectués et comptabilisés
- `ERROR_AMOUNT` : Incohérence entre total et somme des lignes

---

## ⚙️ Traitement comptable

### Fichier : `/applications/plato/src/routes/accounting/rentalManagement/caf/income/income.process.js`

### 🔹 Étape 1 : Validation et préparation

**Fonction** : `validateIncome()`

1. **Récupération des propositions d'affectation**
   - Input : Liste de `transfers` (bankTransactions sélectionnées)
   - Recherche des `AffectationProposal` correspondantes
   - Calcul du montant total

2. **Matching avec fichier CAF**
   ```javascript
   const cafFile = await getCafFile({
     type,        // AL ou APL
     department,
     agency,
     year,
     month
   }, totalAmount)
   ```
   - Recherche fichier avec status `TO_HANDLE`
   - **Contrainte** : Le montant total doit matcher exactement

3. **Résolution des bénéficiaires**
   ```javascript
   const leasesByCodeCAF = await getLeasesByCodeCAF(cafFile)
   ```
   - Pour chaque `codeCAF` du fichier :
     - Recherche `Customer` avec ce `codeCAF`
     - Récupération du `Lease` actif pour la période
     - Validation que le locataire est bien bénéficiaire

4. **Vérification exhaustive**
   ```javascript
   checkRecipients(leasesByCodeCAF, cafFile)
   ```
   - Si `force = false` : Tous les codes CAF doivent avoir un locataire
   - Sinon : Erreur `MISSING_TENANTS` avec liste des codes non trouvés

5. **Protection contre double traitement**
   ```javascript
   await setAffectationProposalToPending(transferIds)
   ```
   - Vérifie que toutes les propositions sont en status `PROPOSAL`
   - Change status vers `PENDING`
   - Empêche re-traitement

6. **Déclenchement asynchrone**
   ```javascript
   await messageBroker.send('validate-income-caf', payload)
   ```
   - Le traitement lourd est délégué au worker RabbitMQ

---

### 🔹 Étape 2 : Affectation comptable (Worker)

**Worker** : `validate-income-caf`

**Fonction** : `assignToLeases()`

1. **Récupération compte RNI**
   - Compte comptable `4726.000000000` (Produits à Recevoir CAF)
   - Utilisé pour les bénéficiaires non trouvés

2. **Création des bénéficiaires**
   ```javascript
   beneficiaries = cafTransfers.map(line => {
     const lease = leasesByCodeCAF[line.codeCAF];

     if (lease) {
       return {
         kind: 'LEASE',
         target: lease._id,
         amount: line.amount,
         period: { year: line.year, month: line.month }
       };
     }

     // Fallback : compte RNI
     return rniBeneficiary(line, accountingAccountRNI);
   })
   ```

3. **Répartition par transaction bancaire**
   ```javascript
   const beneficiariesByBankTransaction =
     groupBeneficiariesByTransactions(bankTransactions, beneficiaries)
   ```
   - Algorithme de bin-packing optimisé
   - Répartit les bénéficiaires sur les virements bancaires
   - Gère les fractionnements si nécessaire

4. **Création des CafTransfer**
   ```javascript
   for (const affectationProposal of affectationProposals) {
     const cafTransfer = await repositories.cafTransfer.createCafTransfer({
       amount: bankTransaction.amount,
       agency,
       period: { month, year },
       creditor: { bankInformation },
       beneficiaries: affectationBeneficiaries
     });

     await assignToLease(cafTransfer._id, {
       accountingLine: {
         journalCode: 'BQCAF'  // Journal bancaire CAF
       },
       letteringAsync: true     // Lettrage différé
     });

     await updateMediaPaymentStatus(
       cafTransfer._id,
       'PROCESSED'
     );
   }
   ```

5. **Écritures comptables générées**
   - Journal : `BQCAF` (Banque CAF)
   - Pour chaque bénéficiaire :
     - Débit : Compte banque
     - Crédit : Compte locataire (si trouvé) ou compte RNI

---

### 🔹 Étape 3 : Finalisation

**Fonction** : `updateStatusAfterIncome()`

Mise à jour des statuts en parallèle :
1. `FilesCAF.status` → `PROCESSED`
2. `AffectationProposal.status` → `PROCESSED`
3. `BankTransaction` lié au `MediaPayment`

---

## 🔑 Mapping et résolution

### Code bailleur → Agence

```javascript
const agencyId = await AgencyDao.getAgencyIdFromCodeLessor(codeLessorCAF)
```

**Table de mapping** : `agencies`
- Champ : `agencies.codeLessor` (array de codes)
- Exemple : `P8456` → Agence Foncia Fabre Gibert

**Important** :
- Si aucune agence trouvée → fichier en `ERROR_AMOUNT`
- Un fichier sans agence ne peut pas être traité

---

### Code CAF → Locataire

```javascript
// 1. Recherche customer par codeCAF
const customers = await retrieveCustomersWithCodeCAF(codesCAF)

// 2. Recherche lease actif
const leases = await retrieveLeaseFromCustomer(customers, cafFile)

// 3. Validation bénéficiaire
const validation = await validateLeaseBeneficiary(lease._id)
```

**Critères de validation** :
- Lease actif à la période du versement
- Customer est locataire (tenant) du lease
- Lease a un compte bancaire valide pour virement

---

## 🚨 Gestion des erreurs

### Erreurs au niveau fichier

| Code erreur | Cause | Résolution |
|-------------|-------|------------|
| `ERROR_AMOUNT` | Total ≠ somme des lignes | Vérifier fichier source CAF |
| `ERROR_AMOUNT` | Agence non trouvée | Ajouter mapping codeLessor |
| `BAD_AMOUNT` | Montant ne match pas banque | Vérifier sélection transactions |

### Erreurs au niveau ligne

| Status | Cause | Action |
|--------|-------|--------|
| `ERROR_SUBSIDY_RECIPIENT_UNKNOWN` | Code CAF non trouvé | Créer/corriger customer.codeCAF |
| Affectation RNI | Locataire non trouvé | Régularisation manuelle via compte 4726 |

---

## 🔍 Requêtes utiles

### Trouver les fichiers en attente
```javascript
db.filesCAF.find({ status: 'TO_HANDLE' })
  .sort({ createdAt: -1 })
```

### Vérifier cohérence montants
```javascript
db.filesCAF.aggregate([
  { $match: { _id: ObjectId('...') } },
  { $project: {
      totalFile: '$amount.value',
      totalLines: { $sum: '$cafTransfers.amount.value' },
      diff: { $subtract: ['$amount.value', { $sum: '$cafTransfers.amount.value' }] }
  }}
])
```

### Lister les codes CAF non trouvés
```javascript
// Via l'API
POST /accounting/rentalManagement/caf/income/validate
{
  "type": "AL",
  "department": "84",
  "year": 2025,
  "month": 11,
  "transfers": [...],
  "force": false  // → retourne MISSING_TENANTS
}
```

---

## 📊 Statistiques collection

**Collection** : `filesCAF`
- **Count** : ~12,120 documents
- **Size** : 58,2 MiB
- **Indexes** : 1 (par défaut)

**Champs les plus utilisés** :
- `agency` (référence)
- `status` (filtrage)
- `type` + `department` + `year` + `month` (recherche)

---

## 🔗 Liens code source

### Flux d'intégration
- **Parser principal** : `/applications/plato/src/flux/caf/cafFiles.process.js`
- **Scheduled task** : `/applications/plato/src/jobs/schedulers/tasks/processFilesCAFAL.ts`
- **DAO** : `/applications/plato/src/services/dao/cafFiles.dao.js`

### Traitement comptable
- **Process income** : `/applications/plato/src/routes/accounting/rentalManagement/caf/income/income.process.js`
- **Routes API** : `/applications/plato/src/routes/accounting/rentalManagement/caf/income/`
- **Tests** : `/applications/plato/src/routes/accounting/rentalManagement/caf/income/income.spectegration.js`

### Constantes
- **Mapping fields** : `/applications/plato/constants/accounting/filesCAF.ts`
- **SFTP metadata** : `/applications/plato/constants/flux/sftpIncomingFile/filesMetadata.ts`

---

## 🎓 Points clés à retenir

1. **Matching montant exact** : Le montant total des transactions bancaires DOIT matcher le fichier CAF
2. **Code CAF critique** : Chaque `cafTransfer.codeCAF` doit correspondre à un `customer.codeCAF`
3. **Fallback RNI** : Les bénéficiaires non trouvés sont affectés au compte 4726 (à régulariser)
4. **Période décalée** : Le fichier du mois N concerne souvent la période N-1
5. **Traitement asynchrone** : L'affectation comptable est traitée par worker pour performance
6. **Protection double traitement** : Status `PENDING` empêche re-traitement accidentel

---

## 📝 Checklist intégration

- [ ] Fichier déposé sur SFTP et scanné
- [ ] Document `SftpIncomingFile` créé avec status `READY`
- [ ] Scheduled task `processFilesCAFAL` a tourné
- [ ] Document `FilesCAF` créé avec status `TO_HANDLE`
- [ ] Agence correctement mappée via `codeLessor`
- [ ] Cohérence montants validée (total = somme lignes)
- [ ] Transactions bancaires sélectionnées dans UI
- [ ] API `/validate` appelée avec paramètres corrects
- [ ] Tous les codes CAF résolus (ou `force: true`)
- [ ] Worker `validate-income-caf` traite le message
- [ ] Écritures comptables créées avec journal `BQCAF`
- [ ] Status `FilesCAF` → `PROCESSED`
- [ ] Status `AffectationProposal` → `PROCESSED`

---

## 🛠️ Script utilitaire

Un script de parsing est disponible pour analyser les fichiers CAF en local :

```bash
node /Users/frx33355/Documents/dev/mcp/scripts/parse-caf-files.js
```

Fournit :
- Analyse structure de chaque fichier
- Breakdown par type (mensuels / régularisations)
- Calcul des totaux et montants nets
- Détection d'incohérences
