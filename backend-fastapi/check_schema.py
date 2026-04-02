import asyncio
import psycopg
import sys
import os

# Add parent dir to path to import app
sys.path.append(os.getcwd())

from app.config import settings

async def check_db():
    try:
        conninfo = settings.DATABASE_URL or f"host={settings.effective_db_host} port={settings.effective_db_port} dbname={settings.effective_db_name} user={settings.effective_db_user} password={settings.effective_db_password}"
        async with await psycopg.AsyncConnection.connect(conninfo) as conn:
            async with conn.cursor() as cur:
                # Check enum types
                await cur.execute("SELECT typname FROM pg_type WHERE typtype = 'e'")
                enums = await cur.fetchall()
                print("Enums:", enums)
                
                # Check table columns
                await cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'dpr_supervisor_entries'")
                cols = await cur.fetchall()
                print("Columns:", cols)
                
                # Check if sheet_type is an enum
                for col_name, data_type in cols:
                    if col_name == 'sheet_type' and data_type == 'USER-DEFINED':
                        await cur.execute("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = (SELECT udt_name FROM information_schema.columns WHERE table_name = 'dpr_supervisor_entries' AND column_name = 'sheet_type')")
                        labels = await cur.fetchall()
                        print("Sheet Type Enum Labels:", labels)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(check_db())
