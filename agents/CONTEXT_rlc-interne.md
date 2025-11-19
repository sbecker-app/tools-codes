# Contexte : RCL Interne - PData updateAllocationKeyRevueIndex

## 🎯 Problème métier

Lorsque les **données historiques d'index** (relevés de compteurs eau/chauffage) ne sont plus en base de données, impossible de calculer la **RCL (Régularisation de Charges Locatives)** pour les lots en gérance.

### Solution
PData `updateAllocationKeyRevueIndex` permet de **forcer manuellement** les consommations (tantièmes) pour les lots en gérance via un fichier CSV.

## 📁 Localisation

```
/Users/frx33355/Documents/dev/millenium/applications/plato/scripts/reusablePdata/updateAllocationKeyRevueIndex/
├── index.ts          # Script principal
├── template.csv      # Template du CSV
└── README.md         # Documentation complète
```

## 📊 Format CSV

### Structure (format ligne par ligne)

```csv
building;Exercice;lot;compteur;index;consomation_totale;consomation_compteur
500181614;5f4fa08a67ab32b2d6684b84;1;710507103;816;2398;10
;;2;710644617;816;2398;12
;;3;7106444273;816;2398;14
;;1;710507103;830;1055;20
;;2;710644617;830;1055;22
;;3;7106444273;830;1055;24
;;1;710507103;836;98201;30
;;2;710644617;836;98201;32
;;3;7106444273;836;98201;34
```

### Parsing par le front

Le CSV est automatiquement parsé en :
```javascript
[
  {
    "building": "500181614",
    "Exercice": "5f4fa08a67ab32b2d6684b84",
    "lot": "1",
    "compteur": "710507103",
    "index": "816",
    "consomation_totale": "2398",
    "consomation_compteur": "10"
  },
  {
    "building": "",
    "Exercice": "",
    "lot": "2",
    "compteur": "710644617",
    "index": "816",
    "consomation_totale": "2398",
    "consomation_compteur": "12"
  },
  ...
]
```

### Lecture des données

Le script :
1. **Extrait building et exercice** : `csvData[0].building`, `csvData[0].Exercice`
2. **Regroupe par clé INDEX** : crée un Map groupant les lignes par `row.index`
3. **Pour chaque clé** :
   - Prend le `consomation_totale` (shareBase total)
   - Extrait les lots : `row.lot` (coOwnershipBylawsId), `row.compteur`, `row.consomation_compteur` (fractionalShares)

## 🔑 Points clés

### 1. Format ligne par ligne
- **Une ligne par combinaison** (lot + clé INDEX)
- Facile à générer dans Excel ou un tableur
- Pas de limite sur le nombre de clés ou de lots
- Colonnes fixes (pas de colonnes dynamiques)

### 2. Colonnes obligatoires
Toutes les colonnes sont fixes et obligatoires :
- `building` : Numéro de building (première ligne seulement)
- `Exercice` : ID période comptable (première ligne seulement)
- `lot` : coOwnershipBylawsId (identifiant du lot en base)
- `compteur` : Numéro de compteur (affichage)
- `index` : Numéro de la clé INDEX
- `consomation_totale` : ShareBase total (répété pour chaque ligne de la même clé)
- `consomation_compteur` : Consommation du lot pour cette clé (fractionalShares)

### 3. Regroupement automatique
Le script regroupe automatiquement les lignes par numéro de clé INDEX (`row.index`)

### 4. Validation des clés
Seules les clés INDEX valides sont acceptées :
- **EAU** : 800-821, 820i-829i
- **RECHAUFFEMENT** : 828-840, 840i-849i
- **GAS** : 720, 750i-754i
- **REPARTITEUR** : 730-739, 740i-749i

## 🔄 Workflow

1. **Upload CSV** via front-ml-admin
2. **Parsing automatique** (première ligne = en-tête)
3. **Détection du building number** (colonne numérique)
4. **Lecture des données** (lignes INDEX, SHARE_BASE_TOTAL, lots)
5. **Validation** (clés INDEX valides, shareBases cohérents)
6. **Création des clés de répartition** en base MongoDB
7. **Suppression de la RCL existante** (si TO_DO)
8. **Recréation de la RCL** avec les nouvelles clés

## 📚 Documentations liées

### Fichiers techniques
- `/applications/plato/src/routes/accounting/rentalManagement/expenseRegularization/FIX_GRAPHQL_ERROR.md`
- `/applications/plato/src/routes/accounting/rentalManagement/expenseRegularization/FIX_PERIODE_COMPTABLE.md`
- `/applications/plato/src/routes/accounting/rentalManagement/expenseRegularization/PROBLEME_BASES_REPARTITION.md`
- `/applications/plato/src/routes/accounting/rentalManagement/expenseRegularization/rcl.md`

### Calcul RCL V2
Le calcul dans `fluid.process.ts` détecte automatiquement les clés avec `accountingPeriod` et utilise directement leur `shareBase` (fallback gracieux).

## 🐛 Points d'attention

1. **L'en-tête est obligatoire** : `building;Exercice;lot;compteur;index;consomation_totale;consomation_compteur`
2. **Les numéros de clés doivent être valides** : seuls les numéros de clés INDEX de categoryAllocationKey sont acceptés
3. **Building** : numéro de building existant en base (première ligne seulement)
4. **Exercice** : ID MongoDB de période comptable valide (première ligne seulement)
5. **lot** : coOwnershipBylawsId (doit exister en base, sinon warning + skip)
6. **compteur** : numéro de compteur (pour affichage/traçabilité)
7. **consomation_totale** : doit être identique pour toutes les lignes d'une même clé
8. **Format ligne par ligne** : une ligne par combinaison (lot + clé)

## 🎯 Exemple d'utilisation

### CSV minimal (2 lots × 3 clés = 6 lignes)
```csv
building;Exercice;lot;compteur;index;consomation_totale;consomation_compteur
500181614;5f4fa08a67ab32b2d6684b84;101;710507103;816;2398;36
;;102;710644617;816;2398;63
;;101;710507103;830;1055;12
;;102;710644617;830;1055;20
;;101;710507103;836;98201;100
;;102;710644617;836;98201;150
```

### Résultat
- 3 clés INDEX créées (816, 830, 836)
- 2 lots en gérance avec leurs consommations
- RCL recréée avec les nouvelles clés
- URLs générées pour accès direct (Index Update + Expense Regularization)

## 🔧 Code clé

### Extraction des données de base
```typescript
const firstRow = csvData[0];
const buildingNumber = firstRow.building?.trim();
const accountingPeriodId = firstRow.Exercice?.trim();
```

### Regroupement par clé INDEX
```typescript
const rowsByKey = new Map<string, CSVRow[]>();
for (const row of csvData) {
  const indexNumber = row.index?.trim();
  if (!rowsByKey.has(indexNumber)) {
    rowsByKey.set(indexNumber, []);
  }
  rowsByKey.get(indexNumber)!.push(row);
}
```

### Extraction par clé
```typescript
for (const [indexNumber, rows] of rowsByKey) {
  // ShareBase total (premier row)
  const totalShareBase = Number.parseFloat(rows[0].consomation_totale);

  // Pour chaque ligne de cette clé
  for (const row of rows) {
    const coOwnershipBylawsId = row.lot?.trim();
    const meterNumber = row.compteur?.trim();
    const fractionalShares = Number.parseFloat(row.consomation_compteur);
  }
}
```

## 📝 Notes de développement

- **Date** : 2025-11-14
- **Contexte** : Monorepo Millenium / Application Plato (legacy NestJS)
- **Parser CSV** : Utilise le CsvLoader de front-ml-admin (ligne 1 = en-tête automatique)
- **Approche** : Lecture directe du CSV parsé, regroupement automatique par clé INDEX
- **Format final** : Format ligne par ligne (une ligne par lot + clé)
- **Avantages** :
  - Facile à générer dans Excel (format tabulaire)
  - Pas de limite sur le nombre de clés ou de lots
  - Colonnes fixes (pas de colonnes dynamiques)
  - Lisible et modifiable facilement
  - Regroupement automatique par le script
