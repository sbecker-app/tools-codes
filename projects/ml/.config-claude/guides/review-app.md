# Review Apps - Guide de création

## Référence

**Repo localstack** : `/Users/frx33355/Documents/dev/localstack`
**Documentation complète** : `localstack/CLAUDE.md`

---

## Création d'une Review App

### Variables GitLab CI

| Variable | Description | Valeurs |
|----------|-------------|---------|
| `REVIEWAPP_NAME` | **Nom unique** de la RA (ex: `seb`, `test-prod-28299`) | string |
| `REVIEWAPP_TYPE` | Type de MongoDB | `BUILD` / `RUN` |
| `INSTANCE_TYPE` | Taille de l'instance | `L` / `XL` |
| `ENABLE_TELEMETRY` | Grafana/Signoz | `true` / `false` |
| `ENABLE_N8N` | Workflow automation | `true` / `false` |
| `HIBERNATION_MODE` | Auto-stop nuit/weekend | `true` / `false` |

### Types BUILD vs RUN

```
BUILD Type (~80GB):                    RUN Type (~1TB):
┌─────────────────────┐                ┌─────────────────────┐
│   Review App        │                │   Review App        │
│ ┌─────────────────┐ │                │ ┌─────────────────┐ │
│ │ MongoDB LOCAL   │ │                │ │ MongoDB REMOTE  │──┼──► Shared MongoDB
│ │ (dump ~80GB)    │ │                │ │ (connector)     │ │    (mongo-run-1)
│ └─────────────────┘ │                │ └─────────────────┘ │    ~1TB prod data
└─────────────────────┘                └─────────────────────┘    refresh daily
```

| Type | MongoDB | Data | Use case |
|------|---------|------|----------|
| **BUILD** | Local | ~80GB dump | Clean env, migrations, tests isolés |
| **RUN** | Shared remote | ~1TB prod | Debug prod, tests réalistes, perfs |

> ⚠️ **RUN** : Database partagée entre toutes les RA RUN, refresh quotidien à 1h du matin

---

## Commande rapide (foncia-duck)

### Paramètres par défaut

| Param | Valeur par défaut |
|-------|-------------------|
| `nom` | `rabecker` |
| `type` | `RUN` |
| `instance-type` | `XL` |
| `signoz/telemetry` | `true` |

### Template de commande

```bash
npx @fonciastark/foncia-duck@latest ra create rabecker \
  --instance-type=XL \
  --type=RUN \
  --signoz=true \
  --slug-versions='{
    "PLATO_VERSION": "master",
    "FRONT_ADB_VERSION": "master",
    "FRONT_ACCOUNTING_VERSION": "master"
  }'
```

### Variables de version disponibles

| Variable | Service |
|----------|---------|
| `PLATO_VERSION` | Backend Plato |
| `FRONT_ADB_VERSION` | Frontend ADB |
| `FRONT_ACCOUNTING_VERSION` | Frontend Accounting |
| `FRONT_ML_ADMIN_VERSION` | ML Admin |
| `FRONT_TRANSACTION_VERSION` | Transaction |
| `MS_GATEWAY_VERSION` | Gateway GraphQL |
| `MS_CUSTOMER_VERSION` | ms-customer |
| `MS_ESTATE_VERSION` | ms-estate |
| `MS_GED_VERSION` | ms-ged |
| `MS_NOTIFICATION_VERSION` | ms-notification |
| `MS_DOCUMENT_VERSION` | ms-document |
| `DATAREF_VERSION` | Dataref |
| `SERVICE_LEASE_VERSION` | service-lease |

> 📄 Liste complète : `/Users/frx33355/Documents/dev/localstack/.env`

---

## Quand tu me demandes une RA

**Exemple de demande :**
> "Crée-moi une RA pour tester PROD-28299"

**Je te propose :**

```bash
# RA rabecker (XL, RUN) avec Plato sur branche PROD-28299
npx @fonciastark/foncia-duck@latest ra create rabecker \
  --instance-type=XL \
  --type=RUN \
  --signoz=true \
  --slug-versions='{"PLATO_VERSION": "PROD-28299"}'
```

**Options à confirmer :**
- [ ] Nom : `rabecker` (ou autre ?)
- [ ] Type : `RUN` (ou `BUILD` ?)
- [ ] Taille : `XL` (ou `L` ?)
- [ ] Services à versionner : Plato seul ? ADB aussi ?

**URL de la RA** : `https://rabecker.review.dev1.fonciamillenium.net`

---

## Accès Grafana (si ENABLE_TELEMETRY=true)

| Champ | Valeur |
|-------|--------|
| **URL** | `https://grafana.{REVIEWAPP_NAME}.review.dev1.fonciamillenium.net` |
| **Email** | reviewapp@local |
| **Password** | Grafana@Review42 |

### Stack monitoring

| Outil | Usage |
|-------|-------|
| **Mimir** | Metrics |
| **Loki** | Logs |
| **Tempo** | Traces |
| **Signoz** | Alternative (même données) |

### Utilisation Tempo (Traces)

1. Grafana → Menu gauche → **Tempo**
2. **Search** → Service : `plato-api-local` ou `plato-api`
3. Ouvrir une trace → **Trace tree**
4. Depuis une trace :
   - Inspecter spans (durées, tags, erreurs)
   - Suivre liens vers **Loki** (logs)

---

## Commandes utiles (foncia-duck)

```bash
# Lister mes RAs
npx @fonciastark/foncia-duck@latest ra ls --self

# Refresh image d'un service
npx @fonciastark/foncia-duck@latest ra refresh-image [instance-id] <service-name>

# Refresh MongoDB (BUILD type only)
npx @fonciastark/foncia-duck@latest ra refresh-mongo [instance-id] --type=full
```

---

## Scripts locaux (repo localstack)

```bash
cd ~/Documents/dev/localstack

# Créer une stack
./scripts/create_stack.sh

# Détruire une stack
./scripts/destroy_stack.sh

# Afficher infos
./scripts/display.sh
```

---

## Hibernation

| Action | Horaire |
|--------|---------|
| **Stop** | 20h00 semaine, tout le weekend |
| **Start** | 8h00 semaine |

Pour désactiver : `HIBERNATION_MODE=false`

---

## Limites

- **Max 3 RAs actives** par utilisateur
- Network : `plato_default` (externe)
- MongoDB BUILD nécessite warm-up initial
