#!/usr/bin/env python3
"""
Script pour investiguer PROD-28230 : Mises en demeure non envoyées
Date de l'incident : 04/11/2025
"""

import snowflake.connector
from datetime import datetime

# IDs des copropriétaires concernés (customer IDs MongoDB)
CUSTOMER_IDS = [
    "64850e8066904ac4384dcd8f",  # TOULOUSE 101785816
    "657651005bb543430d0d4429",  # MARSEILLE 103041737
    "65765100324f70b903f53fec",  # MARSEILLE 103046879
    "65765100e79f4edf79861557",  # MARSEILLE 103034606
    "64850e80f9931de1a96b0096",  # NICE 101291139
    "65c0bd39f6d159fc2a37a1d7",  # TERRE OCCITANE 103144223
    "6576510019d931c365894ef7",  # TERRE OCCITANE 102732743
    "65765100ff47ee72e6cf5e4b",  # TERRE OCCITANE 102740597
]

# Codes copropriétaires externes
EXTERNAL_CODES = [
    "101785816",
    "103041737",
    "103046879",
    "103034606",
    "101291139",
    "103144223",
    "102732743",
    "102740597",
]

def connect():
    """Connexion Snowflake via SSO"""
    return snowflake.connector.connect(
        account='EMERIA-FRANCE',
        user='FRX33355',
        authenticator='externalbrowser',
        role='PUBLIC',
        warehouse='WH_ML_PROD',
        database='DATALAKE_ML_PROD',
        schema='PUBLIC'
    )

def search_logs(conn, date_start="2025-11-04", date_end="2025-11-05"):
    """Recherche les logs liés aux relances contentieux"""

    customer_list = ",".join([f"'{c}'" for c in CUSTOMER_IDS])
    external_list = ",".join([f"'{c}'" for c in EXTERNAL_CODES])

    # Requête pour les logs service-litigation
    query = f"""
    SELECT
        TIMESTAMP,
        SERVICE,
        LOG_LEVEL,
        MESSAGE,
        ATTRIBUTES
    FROM LOGS_ML  -- Adapter le nom de la table
    WHERE TIMESTAMP BETWEEN '{date_start}' AND '{date_end}'
      AND SERVICE LIKE '%litigation%'
      AND (
        MESSAGE LIKE '%reminder%'
        OR MESSAGE LIKE '%recovery%'
        OR MESSAGE LIKE '%dunning%'
      )
      AND (
        ATTRIBUTES LIKE '%{CUSTOMER_IDS[0]}%'
        OR ATTRIBUTES LIKE '%{CUSTOMER_IDS[1]}%'
        OR ATTRIBUTES LIKE '%{CUSTOMER_IDS[2]}%'
        OR ATTRIBUTES LIKE '%{CUSTOMER_IDS[3]}%'
        OR ATTRIBUTES LIKE '%{CUSTOMER_IDS[4]}%'
        OR ATTRIBUTES LIKE '%{CUSTOMER_IDS[5]}%'
        OR ATTRIBUTES LIKE '%{CUSTOMER_IDS[6]}%'
        OR ATTRIBUTES LIKE '%{CUSTOMER_IDS[7]}%'
        OR ATTRIBUTES LIKE '%101785816%'
        OR ATTRIBUTES LIKE '%103041737%'
        OR ATTRIBUTES LIKE '%103046879%'
        OR ATTRIBUTES LIKE '%103034606%'
        OR ATTRIBUTES LIKE '%101291139%'
        OR ATTRIBUTES LIKE '%103144223%'
        OR ATTRIBUTES LIKE '%102732743%'
        OR ATTRIBUTES LIKE '%102740597%'
      )
    ORDER BY TIMESTAMP DESC
    LIMIT 500
    """

    print("Exécution de la requête logs litigation...")
    cursor = conn.cursor()
    cursor.execute(query)
    results = cursor.fetchall()

    print(f"\n=== {len(results)} logs trouvés ===\n")
    for row in results:
        print(f"[{row[0]}] {row[1]} | {row[2]} | {row[3][:200]}...")
        print(f"  Attrs: {str(row[4])[:300]}...")
        print("-" * 80)

    return results

def search_reminder_errors(conn, date_start="2025-11-04", date_end="2025-11-05"):
    """Recherche spécifique des erreurs de reminder"""

    query = f"""
    SELECT
        TIMESTAMP,
        SERVICE,
        LOG_LEVEL,
        MESSAGE,
        ATTRIBUTES
    FROM LOGS_ML  -- Adapter le nom de la table
    WHERE TIMESTAMP BETWEEN '{date_start}' AND '{date_end}'
      AND SERVICE LIKE '%litigation%'
      AND LOG_LEVEL IN ('ERROR', 'WARN')
      AND (
        MESSAGE LIKE '%NOTHING_SENT%'
        OR MESSAGE LIKE '%cannotSendReminderReason%'
        OR MESSAGE LIKE '%LEVEL_MISMATCHED%'
        OR MESSAGE LIKE '%AMOUNT_BELOW%'
        OR MESSAGE LIKE '%CALCULATED_AMOUNT%'
        OR MESSAGE LIKE '%FORECASTED_DEBT%'
      )
    ORDER BY TIMESTAMP DESC
    LIMIT 200
    """

    print("\nRecherche des erreurs/warnings de reminder...")
    cursor = conn.cursor()
    cursor.execute(query)
    results = cursor.fetchall()

    print(f"\n=== {len(results)} erreurs/warnings trouvés ===\n")
    for row in results:
        print(f"[{row[0]}] {row[2]} | {row[3]}")
        print(f"  {str(row[4])[:500]}")
        print("-" * 80)

    return results

def list_available_tables(conn):
    """Liste les tables disponibles pour trouver la bonne"""
    cursor = conn.cursor()

    # Lister les databases
    print("\n📊 Databases disponibles:")
    cursor.execute("SHOW DATABASES")
    for row in cursor.fetchall():
        print(f"  - {row[1]}")

    # Lister les schémas
    print("\n📁 Schémas dans DATALAKE_ML_PROD:")
    cursor.execute("SHOW SCHEMAS IN DATABASE DATALAKE_ML_PROD")
    for row in cursor.fetchall():
        print(f"  - {row[1]}")

    # Chercher toutes les tables
    print("\n📋 Tables dans DATALAKE_ML_PROD:")
    cursor.execute("SHOW TABLES IN DATABASE DATALAKE_ML_PROD")
    tables = cursor.fetchall()
    for row in tables[:30]:  # Limiter à 30
        print(f"  - {row[1]}.{row[2]}")

def explore_datadog_archive(conn):
    """Explorer le schéma DATADOG_ARCHIVE pour les logs"""
    cursor = conn.cursor()

    print("\n📋 Tables dans DATADOG_ARCHIVE:")
    cursor.execute("SHOW TABLES IN SCHEMA DATALAKE_ML_PROD.DATADOG_ARCHIVE")
    tables = cursor.fetchall()
    for row in tables[:20]:
        print(f"  - {row[1]}")

    # Si on trouve une table de logs, on peut requêter
    if tables:
        table_name = tables[0][1]
        print(f"\n📄 Structure de {table_name}:")
        cursor.execute(f"DESCRIBE TABLE DATALAKE_ML_PROD.DATADOG_ARCHIVE.{table_name}")
        for row in cursor.fetchall():
            print(f"  - {row[0]}: {row[1]}")

def explore_plato_recoveryfiles(conn):
    """Explorer les recovery files dans PLATO"""
    cursor = conn.cursor()

    print("\n📋 Toutes les tables dans PLATO:")
    cursor.execute("SHOW TABLES IN SCHEMA DATALAKE_ML_PROD.PLATO")
    tables = cursor.fetchall()
    for row in tables:
        print(f"  - {row[1]}")

    print("\n📋 Tables dans PLATO contenant 'recovery':")
    cursor.execute("SHOW TABLES LIKE '%RECOVERY%' IN SCHEMA DATALAKE_ML_PROD.PLATO")
    tables = cursor.fetchall()
    for row in tables:
        print(f"  - {row[1]}")

    # Chercher les recovery files des customers concernés
    customer_ids = [
        "64850e8066904ac4384dcd8f",
        "657651005bb543430d0d4429",
        "65765100324f70b903f53fec",
        "65765100e79f4edf79861557",
        "64850e80f9931de1a96b0096",
        "65c0bd39f6d159fc2a37a1d7",
        "6576510019d931c365894ef7",
        "65765100ff47ee72e6cf5e4b",
    ]

    print("\n🔍 Recherche des recovery files pour les customers concernés:")
    try:
        customer_list = ",".join([f"'{c}'" for c in customer_ids])
        cursor.execute(f"""
            SELECT _ID, CUSTOMER, LEVEL, KIND, AMOUNT, AUTOMATICREMINDER, UPDATEDAT
            FROM DATALAKE_ML_PROD.PLATO.RECOVERYFILES
            WHERE CUSTOMER:$oid IN ({customer_list})
               OR CUSTOMER IN ({customer_list})
            LIMIT 20
        """)
        results = cursor.fetchall()
        print(f"\n  Trouvé {len(results)} recovery files:")
        for row in results:
            print(f"    ID: {row[0]}, Customer: {row[1]}, Level: {row[2]}, Kind: {row[3]}, Amount: {row[4]}, Auto: {row[5]}, Updated: {row[6]}")
    except Exception as e:
        print(f"  Erreur: {e}")

    # Structure de la table
    print("\n📄 Structure de RECOVERYFILES:")
    try:
        cursor.execute("DESCRIBE TABLE DATALAKE_ML_PROD.PLATO.RECOVERYFILES")
        for row in cursor.fetchall()[:15]:
            print(f"  - {row[0]}: {row[1]}")
    except Exception as e:
        print(f"  Erreur: {e}")

def explore_all_databases(conn):
    """Explorer toutes les databases pour trouver les données"""
    cursor = conn.cursor()

    databases = ["DATALAKE_ML_PROD", "DATAMART_ML_PROD", "DATAPREP_ML_PROD", "EXPORT_ML_PROD", "WORKSPACE_ML_PROD"]

    for db in databases:
        print(f"\n{'='*60}")
        print(f"📊 DATABASE: {db}")
        print(f"{'='*60}")

        try:
            cursor.execute(f"SHOW SCHEMAS IN DATABASE {db}")
            schemas = cursor.fetchall()
            for schema in schemas:
                schema_name = schema[1]
                if schema_name == "INFORMATION_SCHEMA":
                    continue

                print(f"\n  📁 Schema: {schema_name}")
                try:
                    cursor.execute(f"SHOW TABLES IN SCHEMA {db}.{schema_name}")
                    tables = cursor.fetchall()
                    for table in tables[:10]:
                        print(f"    - {table[1]}")
                    if len(tables) > 10:
                        print(f"    ... et {len(tables) - 10} autres tables")
                except Exception as e:
                    print(f"    Erreur: {e}")
        except Exception as e:
            print(f"  Erreur: {e}")

def search_recovery_tables(conn):
    """Chercher les tables liées aux recovery files"""
    cursor = conn.cursor()

    print("\n" + "="*60)
    print("🔍 Recherche de tables 'recovery' ou 'litigation'")
    print("="*60)

    databases = ["DATALAKE_ML_PROD", "DATAMART_ML_PROD", "DATAPREP_ML_PROD"]

    for db in databases:
        try:
            cursor.execute(f"SHOW TABLES LIKE '%RECOVERY%' IN DATABASE {db}")
            tables = cursor.fetchall()
            if tables:
                print(f"\n  {db} - Tables RECOVERY:")
                for t in tables:
                    print(f"    - {t[1]}.{t[2]}")

            cursor.execute(f"SHOW TABLES LIKE '%LITIGATION%' IN DATABASE {db}")
            tables = cursor.fetchall()
            if tables:
                print(f"\n  {db} - Tables LITIGATION:")
                for t in tables:
                    print(f"    - {t[1]}.{t[2]}")

            cursor.execute(f"SHOW TABLES LIKE '%REMINDER%' IN DATABASE {db}")
            tables = cursor.fetchall()
            if tables:
                print(f"\n  {db} - Tables REMINDER:")
                for t in tables:
                    print(f"    - {t[1]}.{t[2]}")

            cursor.execute(f"SHOW TABLES LIKE '%LOG%' IN DATABASE {db}")
            tables = cursor.fetchall()
            if tables:
                print(f"\n  {db} - Tables LOG:")
                for t in tables:
                    print(f"    - {t[1]}.{t[2]}")
        except Exception as e:
            print(f"  {db} - Erreur: {e}")

def explore_recovery_co(conn):
    """Explorer la table RECOVERY_CO"""
    cursor = conn.cursor()

    print("\n" + "="*60)
    print("📋 Structure de DATAMART_ML_PROD.RECOVERY_CO")
    print("="*60)

    try:
        cursor.execute("DESCRIBE TABLE DATAMART_ML_PROD.RECOVERY_CO.DATAMART_ML_PROD")
        for row in cursor.fetchall():
            print(f"  - {row[0]}: {row[1]}")
    except Exception as e:
        print(f"  Erreur describe: {e}")

    # Chercher le bon nom de table
    print("\n📋 Tables dans DATAMART_ML_PROD.RECOVERY_CO:")
    try:
        cursor.execute("SHOW TABLES IN SCHEMA DATAMART_ML_PROD.RECOVERY_CO")
        tables = cursor.fetchall()
        for t in tables:
            print(f"  - {t[1]}")
            # Décrire la première table
            if t[1]:
                cursor.execute(f"DESCRIBE TABLE DATAMART_ML_PROD.RECOVERY_CO.{t[1]}")
                print(f"\n  Structure de {t[1]}:")
                for col in cursor.fetchall():
                    print(f"    - {col[0]}: {col[1]}")
    except Exception as e:
        print(f"  Erreur: {e}")

def query_recovery_data(conn):
    """Requêter les données des copropriétaires concernés"""
    cursor = conn.cursor()

    # IDs externes des copropriétaires
    external_codes = [
        "101785816", "103041737", "103046879", "103034606",
        "101291139", "103144223", "102732743", "102740597"
    ]

    print("\n" + "="*60)
    print("🔍 Recherche des recovery files pour les copropriétaires")
    print("="*60)

    # D'abord lister les tables disponibles
    try:
        cursor.execute("SHOW TABLES IN SCHEMA DATAMART_ML_PROD.RECOVERY_CO")
        tables = cursor.fetchall()
        if tables:
            table_name = tables[0][1]
            print(f"\n  Utilisation de la table: {table_name}")

            # Exemple de données
            cursor.execute(f"SELECT * FROM DATAMART_ML_PROD.RECOVERY_CO.{table_name} LIMIT 5")
            cols = [desc[0] for desc in cursor.description]
            print(f"\n  Colonnes: {cols}")

            rows = cursor.fetchall()
            for row in rows:
                print(f"\n  Row: {row}")

    except Exception as e:
        print(f"  Erreur: {e}")

def find_and_query_recovery(conn):
    """Trouver et interroger les tables recovery"""
    cursor = conn.cursor()

    # IDs MongoDB des customers concernés
    customer_ids = [
        "64850e8066904ac4384dcd8f",  # TOULOUSE 101785816
        "657651005bb543430d0d4429",  # MARSEILLE 103041737
        "65765100324f70b903f53fec",  # MARSEILLE 103046879
        "65765100e79f4edf79861557",  # MARSEILLE 103034606
        "64850e80f9931de1a96b0096",  # NICE 101291139
        "65c0bd39f6d159fc2a37a1d7",  # TERRE OCCITANE 103144223
        "6576510019d931c365894ef7",  # TERRE OCCITANE 102732743
        "65765100ff47ee72e6cf5e4b",  # TERRE OCCITANE 102740597
    ]

    print("\n" + "="*60)
    print("📋 Structure complète de RECOVERY_CO")
    print("="*60)

    cursor.execute("DESCRIBE TABLE DATAMART_ML_PROD.ACCOUNTING.RECOVERY_CO")
    cols = cursor.fetchall()
    for col in cols:
        print(f"  - {col[0]}: {col[1]}")

    print("\n" + "="*60)
    print("🔍 Recherche des copropriétaires concernés")
    print("="*60)

    customer_str = ",".join([f"'{c}'" for c in customer_ids])

    # Noms des copropriétaires (approximatifs)
    names = ["SANTOS", "DIASCORN", "MORIEUX", "HOARAU"]

    # Recherche directe par numéros de compte
    account_numbers = [
        "103144223",  # LUDOVIC SANTOS
        "102732743",  # CORENTIN DIASCORN
        "102740597",  # MICKAEL MORIEUX
        "101785816",  # TOULOUSE
        "103041737",  # MARSEILLE
        "103046879",  # MARSEILLE
        "103034606",  # MARSEILLE
        "101291139",  # NICE
    ]
    numbers_str = ",".join([f"'{n}'" for n in account_numbers])

    print(f"\n  📊 Recherche directe par CO_OWNER_ACCOUNT_NUMBER:")
    cursor.execute(f"""
        SELECT
            DATE_PERIOD,
            AGENCY_NAME,
            CO_OWNER_FULL_NAME,
            CO_OWNER_ACCOUNT_NUMBER,
            LEVEL,
            RECOVERY_STATUS,
            AUTOMATIC_REMINDER,
            AMOUNT / 100.0 as AMOUNT_EUR,
            CALCULATED_AMOUNT / 100.0 as CALCULATED_EUR,
            RECOVERY_FILE_ID,
            LAST_REMINDER_DATE
        FROM DATAMART_ML_PROD.ACCOUNTING.RECOVERY_CO
        WHERE CO_OWNER_ACCOUNT_NUMBER IN ({numbers_str})
        ORDER BY CO_OWNER_ACCOUNT_NUMBER, DATE_PERIOD DESC
    """)
    results = cursor.fetchall()
    print(f"  Trouvé {len(results)} lignes")

    # Filtrer uniquement les ONGOING_REMINDER
    print("\n  === ONGOING_REMINDER uniquement ===")
    for row in results:
        if row[5] == 'ONGOING_REMINDER':
            level_status = "⚠️ BLOQUE" if row[4] == 1.0 else "✅ OK"
            print(f"\n  {row[2]} ({row[3]}) - {row[1]}")
            print(f"      Level: {row[4]} {level_status}")
            print(f"      Amount: {row[7]}€, Calculated: {row[8]}€")
            print(f"      Auto Reminder: {row[6]}")
            print(f"      Recovery ID: {row[9]}")
            print(f"      Last Reminder: {row[10]}")

    # Chercher les cas en Level 1 dans les agences concernées
    print("\n  🔍 Cas en LEVEL 1 avec ONGOING_REMINDER dans agences Terre Occitane, Marseille, Nice, Toulouse:")
    cursor.execute("""
        SELECT
            DATE_PERIOD,
            AGENCY_NAME,
            CO_OWNER_FULL_NAME,
            CO_OWNER_ACCOUNT_NUMBER,
            LEVEL,
            RECOVERY_STATUS,
            AUTOMATIC_REMINDER,
            AMOUNT / 100.0 as AMOUNT_EUR,
            CALCULATED_AMOUNT / 100.0 as CALCULATED_EUR,
            IS_EXCLUDED,
            EXCLUSION_REASON,
            RECOVERY_FILE_ID,
            LAST_REMINDER_DATE
        FROM DATAMART_ML_PROD.ACCOUNTING.RECOVERY_CO
        WHERE LEVEL = 1
          AND RECOVERY_STATUS = 'ONGOING_REMINDER'
          AND (
              AGENCY_NAME ILIKE '%TERRE OCCITANE%'
              OR AGENCY_NAME ILIKE '%NARBONNE%'
              OR CO_OWNER_FULL_NAME ILIKE '%SANTOS%'
              OR CO_OWNER_FULL_NAME ILIKE '%DIASCORN%'
              OR CO_OWNER_FULL_NAME ILIKE '%MORIEUX%'
          )
        ORDER BY AGENCY_NAME, CO_OWNER_FULL_NAME
        LIMIT 30
    """)

    rows = cursor.fetchall()
    col_names = [desc[0] for desc in cursor.description]
    print(f"\n  {len(rows)} lignes trouvées:")

    for row in rows:
        data = dict(zip(col_names, row))
        print(f"\n  === {data.get('CO_OWNER_FULL_NAME', 'N/A')} ({data.get('CO_OWNER_ACCOUNT_NUMBER')}) ===")
        print(f"      Agence: {data.get('AGENCY_NAME')}")
        print(f"      Level: {data.get('LEVEL')}")
        print(f"      Status: {data.get('RECOVERY_STATUS')}")
        print(f"      Auto Reminder: {data.get('AUTOMATIC_REMINDER')}")
        print(f"      Amount: {data.get('AMOUNT_EUR', data.get('AMOUNT'))}€")
        print(f"      Calculated: {data.get('CALCULATED_EUR', data.get('CALCULATED_AMOUNT'))}€")
        print(f"      Is Excluded: {data.get('IS_EXCLUDED')}")
        print(f"      Exclusion: {data.get('EXCLUSION_REASON')}")
        print(f"      Last Reminder: {data.get('LAST_REMINDER_DATE')}")
        print(f"      Recovery ID: {data.get('RECOVERY_FILE_ID')}")

def check_events_history(conn):
    """Vérifier l'historique des événements pour les dossiers bloqués"""
    cursor = conn.cursor()

    # Recovery file IDs des cas bloqués
    recovery_ids = [
        "68dc86391b778399d9e3ce46",  # JANINE ACCOT (NICE)
        "68dca1e11b778399d9f9e42a",  # CORENTIN DIASCORN
        "66ff32ac610e3077e4ec17fe",  # MORIEUX/HOARAU
        "66ff4bd0610e3077e4edc7ba",  # MAURICE ALAYRAC (MARSEILLE)
        "68ddfc5cde50e17d0c77da4d",  # LAURENT BONIER (MARSEILLE)
        "67ee0e285d2af9484b88f22b",  # BRUNO SEGUIN (MARSEILLE)
        "68de10ac4242e9fd5dd19f01",  # LUDOVIC SANTOS
        "68dcbf4d1b778399d912fb75",  # LE PARC DES SEPT DENIERS (OK - passé N2)
    ]

    print("\n" + "="*60)
    print("📋 Historique des événements des recovery files")
    print("="*60)

    ids_str = ",".join([f"'{r}'" for r in recovery_ids])

    # Récupérer les événements
    cursor.execute(f"""
        SELECT
            RECOVERY_FILE_ID,
            CO_OWNER_FULL_NAME,
            LEVEL,
            EVENEMENTS,
            FILE_CREATION_DATE,
            LAST_REMINDER_DATE,
            NEXT_REMINDER_DATE,
            REMINDER_ID,
            REMINDER_NAME
        FROM DATAMART_ML_PROD.ACCOUNTING.RECOVERY_CO
        WHERE RECOVERY_FILE_ID IN ({ids_str})
        ORDER BY CO_OWNER_FULL_NAME
    """)

    results = cursor.fetchall()
    col_names = [desc[0] for desc in cursor.description]

    for row in results:
        data = dict(zip(col_names, row))
        level_status = "✅ N2" if data['LEVEL'] == 2.0 else "⚠️ N1 BLOQUÉ"
        print(f"\n=== {data['CO_OWNER_FULL_NAME']} {level_status} ===")
        print(f"    Recovery ID: {data['RECOVERY_FILE_ID']}")
        print(f"    Level: {data['LEVEL']}")
        print(f"    Created: {data['FILE_CREATION_DATE']}")
        print(f"    Last Reminder: {data['LAST_REMINDER_DATE']}")
        print(f"    Next Reminder: {data['NEXT_REMINDER_DATE']}")
        print(f"    Reminder ID: {data['REMINDER_ID']}")
        print(f"    Reminder Name: {data['REMINDER_NAME']}")

        # Parser les événements
        if data['EVENEMENTS']:
            events = data['EVENEMENTS']
            print(f"    Événements: {type(events)} - {str(events)[:500]}...")

def main():
    print("=" * 60)
    print("PROD-28230 - Investigation Snowflake")
    print("Mises en demeure non envoyées - 04/11/2025")
    print("=" * 60)

    conn = connect()
    print("✅ Connecté à Snowflake\n")

    # Trouver et interroger les tables recovery
    find_and_query_recovery(conn)

    # Vérifier l'historique des événements
    check_events_history(conn)

    conn.close()
    print("\n✅ Terminé")

if __name__ == "__main__":
    main()
