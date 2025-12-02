---
type: doc
title: Accès Local au BO Millenium
tags: [bo, local, dev, impersonate, datadog]
created: 2025-11-20
---

# Accès Local au BO Millenium

## Configuration

| Environnement | URL |
|---------------|-----|
| **Local** | `http://localhost:8081/` |
| **PP** | `https://foncia-bo.pp.fonciamillenium.net/` |
| **PROD** | `https://foncia-bo.fonciamillenium.net/` |

---

## Impersonation (accès utilisateur)

Pour tester en tant qu'utilisateur d'un cabinet :

1. Aller sur `http://localhost:8081/impersonate`
2. Sélectionner le **cabinet** souhaité (ex: FONCIA AD IMMOBILIER - 0580)
3. Sélectionner un **utilisateur** du cabinet
4. Cliquer sur "Impersonate"

---

## Navigation

### Accéder à un bailleur

1. Menu **Clients** → **Bailleurs**
2. Rechercher par numéro de bailleur (ex: `200209356`)
3. Ou accéder directement via URL :
   ```
   http://localhost:8081/customer/{customerId}/lessor?activeLessor={lessorId}&activeMandates=0&mandateId={mandateId}
   ```

### Accéder à un locataire

1. Menu **Clients** → **Locataires**
2. Rechercher par numéro de bail ou nom
3. Ou accéder directement via URL :
   ```
   http://localhost:8081/customer/{customerId}/tenant?activeLease={leaseId}
   ```

---

## Problèmes connus

### Navigation directe par URL ne charge pas

**Symptôme** : La page reste sur le splash screen lors d'un accès direct par URL.

**Solution** : Passer par le menu et la recherche au lieu de l'URL directe.

---

## Logs Datadog

| Environnement | URL |
|---------------|-----|
| **PP** | https://foncia-stark-pp.datadoghq.eu/logs |
| **PROD** | https://foncia-stark-prod.datadoghq.eu/logs |

### Requêtes utiles

- **Lettrage CAF** : `caf-lettering`
- **Erreurs Plato** : `service:plato @level:error`
- **Service Lease** : `service:service-lease`
