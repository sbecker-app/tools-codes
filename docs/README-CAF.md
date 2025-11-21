# 📚 Documentation Intégration Fichiers CAF

> Guide complet pour l'intégration des fichiers CAF (Caisse d'Allocations Familiales) dans Millenium

---

## 📄 Documents disponibles

### 1️⃣ Guide détaillé avec diagrammes Mermaid ⭐
**[`process-integration-caf-recap.md`](./process-integration-caf-recap.md)** (941 lignes)

Documentation complète avec diagrammes visuels :
- ✅ Architecture globale (diagrammes)
- ✅ Flux de traitement (séquences détaillées)
- ✅ Modèle de données (ERD et classes)
- ✅ États et transitions
- ✅ Format fichier CAF (positions fixes)
- ✅ Processus de mapping
- ✅ Gestion des erreurs (flowchart)
- ✅ Points clés illustrés
- ✅ Checklist d'intégration
- ✅ Métriques et monitoring

**Idéal pour** : Comprendre visuellement le processus complet

---

### 2️⃣ Documentation technique approfondie
**[`integration-fichiers-caf.md`](./integration-fichiers-caf.md)**

Documentation texte détaillée :
- 📖 Vue d'ensemble du processus
- 🔄 Architecture (SFTP → MongoDB → Worker)
- 📄 Structure fichiers CAF (mapping champs)
- 🗄️ Modèle de données MongoDB
- ⚙️ Traitement comptable (étapes détaillées)
- 🔑 Mapping et résolution (code bailleur, code CAF)
- 🚨 Gestion des erreurs (codes et résolutions)
- 🔍 Requêtes MongoDB utiles
- 🔗 Liens vers code source
- 📝 Checklist d'intégration

**Idéal pour** : Développement et troubleshooting

---

## 🛠️ Outils et scripts

### Parser de fichiers CAF

**Script de parsing JSON** : [`/scripts/parse-caf-to-json.js`](../scripts/parse-caf-to-json.js)
```bash
node /Users/frx33355/Documents/dev/mcp/scripts/parse-caf-to-json.js
```
- ✅ Parse les fichiers CAF en JSON structuré
- ✅ Crée un fichier par fichier source
- ✅ Génère un fichier combiné
- ✅ Calcule les totaux et statistiques

**Script d'affichage** : [`/scripts/parse-caf-files.js`](../scripts/parse-caf-files.js)
```bash
node /Users/frx33355/Documents/dev/mcp/scripts/parse-caf-files.js
```
- ✅ Affiche un résumé formaté
- ✅ Breakdown par type (mensuels/régularisations)
- ✅ Calcul des sommes à intégrer

---

## 📊 Données d'exemple

### Fichiers JSON parsés

**Emplacement** : `/data/`

| Fichier | Taille | Description |
|---------|--------|-------------|
| `CAF841_2025110790626_0601.json` | 6 KB | APL Département 84 - 3 bénéficiaires |
| `CAFAL301_2025103090703_0601.json` | 44 KB | AL Département 30 - 57 bénéficiaires |
| `CAFAL841_2025103090710_0601.json` | 461 KB | AL Département 84 - 604 bénéficiaires |
| `caf-combined.json` | 582 KB | **Fichier combiné - 664 bénéficiaires** |

**Résumé global** :
- Total bénéficiaires : 664
- Montant total versements : 181 411,26 €
- Retenues : 14 165,74 €
- **Montant net à intégrer : 167 245,52 €**

---

## 🚀 Quick Start

### 1. Comprendre le processus
```bash
# Lire d'abord le récapitulatif visuel
cat process-integration-caf-recap.md

# Puis la doc technique pour les détails
cat integration-fichiers-caf.md
```

### 2. Parser des fichiers CAF
```bash
# Parser en JSON
node scripts/parse-caf-to-json.js

# Afficher résumé
node scripts/parse-caf-files.js
```

### 3. Vérifier les données
```javascript
// Charger le fichier combiné
const data = require('./data/caf-combined.json');

// Résumé
console.log(data.summary);
// {
//   totalBeneficiaries: 664,
//   totalAmount: 181411.26,
//   totalRetenue: 14165.74,
//   netAmount: 167245.52,
//   currency: 'EUR'
// }

// Parcourir les fichiers
data.files.forEach(file => {
  console.log(file.metadata);
  file.cafTransfers.forEach(t => {
    console.log(t.codeCAF, t.name, t.amount.valueEur);
  });
});
```

---

## 🔍 Cas d'usage

### Pour un développeur

**Tâche** : Implémenter une nouvelle fonctionnalité CAF

1. Lire [`process-integration-caf-recap.md`](./process-integration-caf-recap.md) pour comprendre l'architecture
2. Consulter les diagrammes de séquence pour identifier les points d'intégration
3. Référencer [`integration-fichiers-caf.md`](./integration-fichiers-caf.md) pour les détails techniques
4. Utiliser les scripts de parsing pour tester avec des vraies données

### Pour un support

**Tâche** : Débugger un fichier CAF bloqué

1. Consulter la **Checklist d'intégration** dans [`process-integration-caf-recap.md`](./process-integration-caf-recap.md#-checklist-dintégration)
2. Suivre le flowchart de gestion des erreurs
3. Utiliser les requêtes MongoDB de [`integration-fichiers-caf.md`](./integration-fichiers-caf.md#-requêtes-utiles)
4. Parser le fichier avec le script pour vérifier la cohérence

### Pour un Product Owner

**Tâche** : Comprendre le processus métier

1. Lire la section [Vue d'ensemble](./process-integration-caf-recap.md#-vue-densemble)
2. Consulter le diagramme [Architecture globale](./process-integration-caf-recap.md#%EF%B8%8F-architecture-globale)
3. Comprendre les [Points clés](./process-integration-caf-recap.md#-points-clés)
4. Analyser les [Métriques et monitoring](./process-integration-caf-recap.md#-métriques-et-monitoring)

---

## 🔗 Liens rapides

### Documentation
- [Récapitulatif avec Mermaid](./process-integration-caf-recap.md) ⭐
- [Documentation technique](./integration-fichiers-caf.md)

### Code source (Millenium)
- Parser principal : `/applications/plato/src/flux/caf/cafFiles.process.js`
- Scheduled task : `/applications/plato/src/jobs/schedulers/tasks/processFilesCAFAL.ts`
- Traitement comptable : `/applications/plato/src/routes/accounting/rentalManagement/caf/income/income.process.js`
- Constantes : `/applications/plato/constants/accounting/filesCAF.ts`

### Scripts
- [parse-caf-to-json.js](../scripts/parse-caf-to-json.js)
- [parse-caf-files.js](../scripts/parse-caf-files.js)

### Données
- [Fichiers JSON parsés](../data/)

---

## 📚 Glossaire

| Terme | Description |
|-------|-------------|
| **CAF** | Caisse d'Allocations Familiales |
| **AL** | Aide au Logement (code 999) |
| **APL** | Aide Personnalisée au Logement (code 900) |
| **RNI** | Compte comptable 4726 "Produits à Recevoir CAF" pour bénéficiaires non trouvés |
| **Code CAF** | Identifiant allocataire (15 caractères) mappé sur `customer.codeCAF` |
| **Code bailleur** | Code agence (ex: P8456) mappé sur `agencies.codeLessor` |
| **BQCAF** | Journal comptable bancaire CAF |
| **MediaPayment** | Type de paiement incluant CafTransfer |

---

## ❓ FAQ

### Que faire si le montant ne match pas ?
Consulter le flowchart [Gestion des erreurs](./process-integration-caf-recap.md#%EF%B8%8F-gestion-des-erreurs) dans le récapitulatif.

### Comment trouver les codes CAF manquants ?
Utiliser la requête MongoDB dans [`integration-fichiers-caf.md`](./integration-fichiers-caf.md#-requêtes-utiles) section "Codes CAF non trouvés".

### Pourquoi certains bénéficiaires vont en RNI ?
Voir la section [Fallback RNI](./process-integration-caf-recap.md#5-fallback-rni) dans les Points clés.

### Comment relancer un fichier bloqué ?
Suivre la [Checklist d'intégration](./process-integration-caf-recap.md#-checklist-dintégration) étape par étape.

---

## 📧 Support

Pour toute question ou problème :
1. Consulter d'abord cette documentation
2. Vérifier les diagrammes de séquence dans le récapitulatif
3. Utiliser les scripts de parsing pour analyser les fichiers
4. Consulter les logs MongoDB et RabbitMQ

---

**Dernière mise à jour** : 2025-11-20
**Auteur** : Agent ML (Claude Code)
**Version** : 1.0
