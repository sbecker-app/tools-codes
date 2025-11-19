# Processus RCL et Saisie d'Index

## Vue d'ensemble

La **Régularisation de Charges Locatives (RCL)** permet de calculer la répartition des charges d'un immeuble entre les différents lots (locataires) en fonction de leur consommation réelle.

## 1. Flux global : Saisie d'index → RCL

```mermaid
flowchart TD
    Start([Début d'une période comptable]) --> Expenses[Saisie des dépenses<br/>dans la comptabilité]
    Expenses --> IndexReading[Relevé des index<br/>compteurs individuels]
    IndexReading --> CreateRCL[Création de la RCL]
    CreateRCL --> Calculation[Calcul des charges<br/>par lot]
    Calculation --> Result[RCL complétée<br/>Montants par locataire]
```

## 2. Saisie des index (Compteurs)

### Qu'est-ce qu'un index ?

Un **index** est une valeur de compteur relevée à un instant T :
- **Eau** : 123 m³
- **Gaz** : 456 m³
- **Chauffage** : 789 kWh

### Historique des relevés

```mermaid
timeline
    title Historique des index pour un compteur d'eau
    01/01/2024 : Index 100 m³
               : Période N-1
    31/03/2024 : Index 150 m³
               : Consommation = 150 - 100 = 50 m³
    01/04/2024 : Période N commence
    30/06/2024 : Index 200 m³
               : Consommation période N = 200 - 150 = 50 m³
```

### Structure des données

```mermaid
erDiagram
    UNIT ||--o{ FLUID : "a des compteurs"
    FLUID ||--o{ HISTORY : "historique"

    UNIT {
        ObjectId _id
        string unitNumber
        ObjectId building
    }

    FLUID {
        string deviceNumber
        ObjectId meter
    }

    HISTORY {
        number value "Index relevé"
        date readingDate "Date du relevé"
        ObjectId accountingPeriod "Période liée"
        string type "INDEX ou PACKAGE"
    }
```

## 3. Clés de répartition (Allocation Keys)

### Principe

Une **clé de répartition** définit comment répartir une charge entre les lots d'un immeuble.

```mermaid
graph TD
    Building[Immeuble] --> AK1[Clé 816 - Eau froide]
    Building --> AK2[Clé 830 - Chauffage]
    Building --> AK3[Clé 836 - Eau chaude]

    AK1 --> U1[Lot 1: 30 m³]
    AK1 --> U2[Lot 2: 32 m³]
    AK1 --> U3[Lot 3: 34 m³]

    AK2 --> U4[Lot 1: 150 kWh]
    AK2 --> U5[Lot 2: 180 kWh]
    AK2 --> U6[Lot 3: 170 kWh]
```

### Types de clés

```mermaid
mindmap
  root((Clés de<br/>répartition))
    INDEX
      Eau 800-821
      Chauffage 828-840
      Gaz 720
      Répartiteurs 730-739
    RATE
      Tantièmes
      Surface
      Quote-part
```

## 4. Calcul de la RCL - Cas normal

### Étape 1 : Récupération des données

```mermaid
sequenceDiagram
    participant Process as createExpenseRegularization
    participant DB as Base de données
    participant Calc as Calcul

    Process->>DB: Récupérer période comptable
    Process->>DB: Récupérer dépenses (accountingLines)
    Process->>DB: Récupérer baux (leases)
    Process->>DB: Récupérer clés de répartition
    Process->>Calc: Lancer les calculs
```

### Étape 2 : Calcul des consommations par clé INDEX

```mermaid
flowchart LR
    subgraph "Clé 816 - Eau"
        Start[Total dépenses:<br/>1000 €] --> GetUnits[Récupérer les lots<br/>de la clé]
        GetUnits --> CalcConso[Calculer consommation<br/>de chaque lot]
        CalcConso --> Sum[Somme totale:<br/>96 m³]
    end

    subgraph "Lot 1"
        L1Start[Compteur début:<br/>100 m³] --> L1End[Compteur fin:<br/>130 m³]
        L1End --> L1Conso[Consommation:<br/>30 m³]
    end

    subgraph "Lot 2"
        L2Start[Compteur début:<br/>200 m³] --> L2End[Compteur fin:<br/>232 m³]
        L2End --> L2Conso[Consommation:<br/>32 m³]
    end

    subgraph "Lot 3"
        L3Start[Compteur début:<br/>300 m³] --> L3End[Compteur fin:<br/>334 m³]
        L3End --> L3Conso[Consommation:<br/>34 m³]
    end
```

### Étape 3 : Répartition du montant

```mermaid
flowchart TD
    Total[Total dépense Eau:<br/>1000 €<br/>Total consommation: 96 m³]

    Total --> Lot1[Lot 1: 30 m³<br/>30/96 × 1000 = 312,50 €]
    Total --> Lot2[Lot 2: 32 m³<br/>32/96 × 1000 = 333,33 €]
    Total --> Lot3[Lot 3: 34 m³<br/>34/96 × 1000 = 354,17 €]

    style Total fill:#e1f5ff
    style Lot1 fill:#c3f0ca
    style Lot2 fill:#c3f0ca
    style Lot3 fill:#c3f0ca
```

## 5. Cas spécial : Données perdues (PROD-27785)

### Problème

Parfois, les **index historiques ne sont plus en base** (migration, perte de données, etc.) mais on connaît les consommations réelles grâce à des documents papier.

### Solution : Script PData "Revue des Index"

```mermaid
flowchart TD
    Start([Index perdus en DB]) --> CSV[Créer fichier CSV<br/>avec consommations réelles]
    CSV --> Script[Exécuter script PData<br/>updateAllocationKeyRevueIndex]
    Script --> CreateKey[Créer clé spéciale<br/>'816 - Revue des Index']
    CreateKey --> ForceValues[Forcer shareBase = 2398<br/>fractionalShares par lot]
    ForceValues --> RecreateRCL[Recréer la RCL]
```

### Format CSV

```csv
building;Exercice;lot;compteur;index;consomation_totale;consomation_compteur
500181614;5f4fa08a67ab32b2d6684b84;1;710507103;816;2398;30
;;2;710644617;816;2398;32
;;3;7106444273;816;2398;34
```

**Signification:**
- `building`: Numéro d'immeuble
- `Exercice`: ID de la période comptable
- `lot`: ID du lot (coOwnershipBylawsId)
- `compteur`: Numéro de compteur (affichage)
- `index`: Numéro de la clé (816 = eau froide)
- `consomation_totale`: **Total immeuble forcé** (shareBase = 2398)
- `consomation_compteur`: **Consommation du lot forcée** (fractionalShares = 30)

### Clé PData créée

```mermaid
erDiagram
    ALLOCATION_KEY {
        string number "816"
        string genericTitle "816 - Revue des Index"
        string kind "INDEX"
        number shareBase "2398 (forcé)"
        ObjectId accountingPeriod "Lié à la période"
    }

    UNIT_1 {
        number fractionalShares "30 (forcé)"
        array fluids "[] (vide!)"
    }

    UNIT_2 {
        number fractionalShares "32 (forcé)"
        array fluids "[] (vide!)"
    }

    ALLOCATION_KEY ||--o{ UNIT_1 : contains
    ALLOCATION_KEY ||--o{ UNIT_2 : contains
```

**Point clé:** Les `fluids` sont **vides**, seul `fractionalShares` est renseigné !

## 6. Routing automatique (PROD-27785)

### Détection et aiguillage

```mermaid
flowchart TD
    Start([createExpenseRegularization]) --> Check{Existe-t-il des clés<br/>'XXX - Revue des Index'<br/>pour cette période?}

    Check -->|OUI| Legacy[Utiliser code LEGACY<br/>legacyAllocationKeyWithDataLost/]
    Check -->|NON| Normal[Utiliser code NORMAL<br/>processes/]

    Legacy --> MergePData[Fusionner données PData<br/>avec expenses]
    MergePData --> CalcLegacy[Calculer RCL<br/>avec valeurs forcées]

    Normal --> CalcNormal[Calculer RCL<br/>depuis fluids DB]

    CalcLegacy --> Result[RCL créée]
    CalcNormal --> Result

    style Check fill:#fff3cd
    style Legacy fill:#f8d7da
    style Normal fill:#d1ecf1
```

### Code de détection

```typescript
async function hasPdataRevueIndexKeys(
  accountingPeriodId: string,
  buildingId: string,
): Promise<boolean> {
  const pdataKeys = await AllocationKeyModel.find({
    building: buildingId,
    accountingPeriod: accountingPeriodId,
    genericTitle: { $regex: /- Revue des Index$/ }
  }).limit(1);

  return pdataKeys.length > 0;
}
```

## 7. Traitement Legacy - Fusion des données PData

### Étape 1 : Récupération des clés PData

```mermaid
sequenceDiagram
    participant Legacy as Code Legacy
    participant DB as MongoDB
    participant Merge as mergeWithPdataAllocationkey

    Legacy->>DB: Trouver clés "- Revue des Index"<br/>pour cette période
    DB-->>Legacy: [Clé 816, Clé 830, ...]
    Legacy->>Merge: Fusionner avec expenses
```

### Étape 2 : Fusion avec les expenses

```mermaid
flowchart LR
    subgraph "Expense original"
        E1[allocationKey.number = 816<br/>shareBase = calculé DB<br/>units avec fluids]
    end

    subgraph "Clé PData"
        P1[number = 816<br/>shareBase = 2398 forcé<br/>units avec fractionalShares]
    end

    subgraph "Expense fusionné"
        M1[allocationKey.number = 816<br/>shareBase = 2398 ✅<br/>units avec fractionalShares ✅<br/>fluids = [] ✅]
    end

    E1 --> Fusion{Merge}
    P1 --> Fusion
    Fusion --> M1

    style P1 fill:#fff3cd
    style M1 fill:#d4edda
```

### Étape 3 : Calcul avec valeurs forcées

**Dans `fluid.process.ts` (legacy):**

```mermaid
flowchart TD
    Start[Calculer shareBase<br/>de la clé 816] --> CheckExpense{expense.allocationKey<br/>a un shareBase?}

    CheckExpense -->|OUI<br/>Données PData| UseForced[Utiliser shareBase forcé:<br/>2398 ✅]
    CheckExpense -->|NON| CalcDB[Calculer depuis fluids DB]

    UseForced --> Result[shareBase = 2398]
    CalcDB --> Result2[shareBase = calculé]

    style UseForced fill:#d4edda
```

**Dans `expenseType.computation.ts` (legacy):**

```mermaid
flowchart TD
    Start[Pour chaque unit] --> CheckFluids{unit.fluids<br/>existe et non vide?}

    CheckFluids -->|OUI| CalcFromFluids[Calculer depuis fluids<br/>newIndex - oldIndex]
    CheckFluids -->|NON| CheckFractional{unit.fractionalShares<br/>existe?}

    CheckFractional -->|OUI<br/>Données PData| UseFractional[Utiliser fractionalShares:<br/>30 ✅<br/>deviceNumber: 'N/A']
    CheckFractional -->|NON| Skip[Ignorer cette unit]

    CalcFromFluids --> Result[Ligne d'index créée]
    UseFractional --> Result

    style UseFractional fill:#d4edda
```

## 8. Résultat dans la RCL

### Vue dans l'interface

```mermaid
graph TD
    subgraph "RCL - Clé 816 Eau"
        Header[Base totale: 2398 m³<br/>Dépense totale: 1000 €]

        Header --> L1[Lot 1 - Compteur N/A<br/>Consommation: 30 m³<br/>Montant: 12,53 €]
        Header --> L2[Lot 2 - Compteur N/A<br/>Consommation: 32 m³<br/>Montant: 13,34 €]
        Header --> L3[Lot 3 - Compteur N/A<br/>Consommation: 34 m³<br/>Montant: 14,18 €]
    end

    style Header fill:#e1f5ff
    style L1 fill:#fff3cd
    style L2 fill:#fff3cd
    style L3 fill:#fff3cd
```

**Remarque:** Le compteur est "N/A" car il n'y a pas de compteur physique en DB, juste des valeurs forcées.

## 9. Schéma complet du flux PROD-27785

```mermaid
sequenceDiagram
    actor User as Utilisateur
    participant Script as Script PData
    participant DB as MongoDB
    participant RCL as createExpenseRegularization
    participant Router as hasPdataRevueIndexKeys
    participant Legacy as Code Legacy
    participant Normal as Code Normal

    User->>Script: Upload CSV avec valeurs forcées
    Script->>DB: Créer clés "XXX - Revue des Index"
    Script->>DB: Supprimer RCL existante
    Script->>RCL: Créer nouvelle RCL

    RCL->>Router: Y a-t-il des clés PData?
    Router->>DB: SELECT ... WHERE genericTitle LIKE '% - Revue des Index'
    DB-->>Router: OUI (1 clé trouvée)
    Router-->>RCL: true

    RCL->>Legacy: Utiliser code legacy
    Legacy->>DB: Récupérer clés PData
    Legacy->>Legacy: Fusionner shareBase et fractionalShares
    Legacy->>Legacy: Calculer montants avec valeurs forcées
    Legacy-->>RCL: RCL complétée

    RCL-->>User: RCL disponible avec valeurs forcées ✅

    Note over Legacy: Si pas de clés PData:<br/>RCL->>Normal->>Calculs normaux
```

## 10. Avantages de cette architecture

```mermaid
mindmap
  root((Architecture<br/>PROD-27785))
    Isolation
      Code legacy séparé
      Pas de régression
      Facile à supprimer
    Automatique
      Détection auto
      Routing transparent
      Pas de config manuelle
    Traçabilité
      Logs explicites
      Pattern "- Revue des Index"
      Compteur "N/A" visible
    Flexibilité
      Valeurs forcées
      Script réutilisable
      Support multi-clés
```

## 11. Résumé visuel

```mermaid
flowchart TD
    subgraph "Cas Normal"
        N1[Index en DB] --> N2[Calcul auto<br/>consommations]
        N2 --> N3[RCL avec<br/>valeurs réelles]
    end

    subgraph "Cas PData PROD-27785"
        P1[Index perdus] --> P2[CSV avec<br/>valeurs forcées]
        P2 --> P3[Script PData]
        P3 --> P4[Clé 'XXX - Revue des Index']
        P4 --> P5[Routing auto<br/>vers code legacy]
        P5 --> P6[RCL avec<br/>valeurs forcées]
    end

    style N3 fill:#d1ecf1
    style P6 fill:#d4edda
```

---

## Glossaire

- **RCL** : Régularisation de Charges Locatives
- **Index** : Valeur d'un compteur à un instant T
- **Clé de répartition** : Règle de calcul pour répartir une charge
- **ShareBase** : Total de la base de répartition (ex: total consommation immeuble)
- **FractionalShares** : Part d'un lot dans la base de répartition (ex: consommation du lot)
- **PData** : Script de données manuelles pour corriger/forcer des valeurs
- **Legacy** : Code ancien/spécifique conservé pour compatibilité
