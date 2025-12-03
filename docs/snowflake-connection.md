---
title: Configuration Snowflake ML
status: annexe
domain: tech
tags: [snowflake, datalake, config, ml]
created: 2024-12-03
updated: 2024-12-03
---

# Configuration Snowflake pour Millenium

## Connexion MCP

```toml
[connections.ml_prod]
account = "EMERIA-FRANCE"
user = "FRX33355"
authenticator = "externalbrowser"
role = "PUBLIC"
warehouse = "WH_ML_PROD"
database = "DATALAKE_ML_PROD"
schema = "PUBLIC"
```

## Détails

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| Account | `EMERIA-FRANCE` | Compte Snowflake Emeria |
| User | `FRX33355` | Utilisateur SSO |
| Authenticator | `externalbrowser` | Auth via navigateur (SSO Okta) |
| Role | `PUBLIC` | Rôle par défaut |
| Warehouse | `WH_ML_PROD` | Warehouse Millenium Production |
| Database | `DATALAKE_ML_PROD` | Datalake ML Production |
| Schema | `PUBLIC` | Schéma par défaut |

## Configuration MCP

Fichier de config : `/Users/frx33355/.config/snowflake/mcp_config.yaml`

Commande MCP :
```bash
uvx snowflake-labs-mcp --service-config-file /Users/frx33355/.config/snowflake/mcp_config.yaml --connection-name ml_prod
```

## Usage

### Via MCP (Claude Code)

Le serveur MCP Snowflake est configuré avec `uvx snowflake-labs-mcp`.

Outils disponibles :
- `execute_sql` - Exécuter des requêtes SQL
- `list_databases` - Lister les bases
- `list_schemas` - Lister les schémas
- `list_tables` - Lister les tables
- `describe_table` - Décrire une table

### Via CLI directe

```bash
# Connexion via snowsql
snowsql -a EMERIA-FRANCE -u FRX33355 --authenticator externalbrowser
```

### Via Python

```python
import snowflake.connector

conn = snowflake.connector.connect(
    account='EMERIA-FRANCE',
    user='FRX33355',
    authenticator='externalbrowser',
    role='PUBLIC',
    warehouse='WH_ML_PROD',
    database='DATALAKE_ML_PROD',
    schema='PUBLIC'
)
```

## Notes

- L'authentification `externalbrowser` ouvre un navigateur pour le SSO Okta
- Le warehouse `WH_ML_PROD` est dédié aux requêtes Millenium
- Pour les requêtes lourdes, préférer des horaires off-peak
