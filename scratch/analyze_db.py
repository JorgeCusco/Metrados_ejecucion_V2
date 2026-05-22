import psycopg2
from psycopg2 import sql

import psycopg2
from psycopg2 import sql

# Parametros extraidos de la cadena: postgresql://postgres.cdinoxmyukpasihkkkmd:Jo.9839514500@aws-0-us-west-2.pooler.supabase.com:6543/postgres
DB_USER = "postgres.cdinoxmyukpasihkkkmd"
DB_PASS = "Jo.9839514500"
DB_HOST = "aws-0-us-west-2.pooler.supabase.com"
DB_PORT = "6543"
DB_NAME = "postgres"

def analyze():
    try:
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            sslmode="require"
        )
        cur = conn.cursor()
        
        # Get all tables in public schema
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cur.fetchall()]
        
        print(f"Total tables found: {len(tables)}\n")
        
        results = []
        for table in tables:
            # Get row count
            cur.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(sql.Identifier(table)))
            count = cur.fetchone()[0]
            
            # Get columns
            cur.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = %s 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
            """, (table,))
            columns = cur.fetchall()
            
            results.append({
                "name": table,
                "count": count,
                "columns": columns
            })
            
        # Get views
        cur.execute("""
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        views = [row[0] for row in cur.fetchall()]
        
        print("TABLES ANALYSIS:")
        for res in results:
            print(f"- {res['name']} ({res['count']} rows)")
            # col_str = ", ".join([f"{c[0]} ({c[1]})" for c in res['columns']])
            # print(f"  Columns: {col_str}")
            
        print("\nVIEWS FOUND:")
        for view in views:
            print(f"- {view}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze()
