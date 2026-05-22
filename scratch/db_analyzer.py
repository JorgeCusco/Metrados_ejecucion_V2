import psycopg2
from psycopg2 import sql
import os

DB_USER = "postgres.cdinoxmyukpasihkkkmd"
DB_PASS = "COSTOSYPRESUPUESTOS"
DB_HOST = "aws-0-us-west-2.pooler.supabase.com"
DB_PORT = "6543"
DB_NAME = "postgres"

def run_analysis():
    conn = psycopg2.connect(
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        sslmode="require"
    )
    cur = conn.cursor()

    report = ["# Análisis de la Base de Datos Supabase", ""]

    # 1. Tablas y Filas
    cur.execute("""
        SELECT relname as table_name, n_live_tup as row_count
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC;
    """)
    tables = cur.fetchall()
    report.append("## Tablas y Volumen de Datos")
    for t in tables:
        report.append(f"- **{t[0]}**: {t[1]} filas")
    report.append("")

    # 2. Índices
    cur.execute("""
        SELECT tablename, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename;
    """)
    indexes = cur.fetchall()
    report.append("## Índices Existentes")
    for i in indexes:
        report.append(f"- **{i[0]}** -> {i[1]}")
    report.append("")

    # 3. Claves Foráneas
    cur.execute("""
        SELECT
            tc.table_name, kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
    """)
    fks = cur.fetchall()
    report.append("## Claves Foráneas (Relaciones)")
    for fk in fks:
        report.append(f"- **{fk[0]}.{fk[1]}** -> **{fk[2]}.{fk[3]}**")

    # Guardar en archivo
    with open('scratch/analysis_output.md', 'w', encoding='utf-8') as f:
        f.write("\n".join(report))

    cur.close()
    conn.close()

if __name__ == "__main__":
    run_analysis()
