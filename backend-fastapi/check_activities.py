import asyncio
import psycopg
import selectors
import sys, os
sys.path.append(os.getcwd())
from app.config import settings

async def check():
    conninfo = settings.DATABASE_URL or f"host={settings.effective_db_host} port={settings.effective_db_port} dbname={settings.effective_db_name} user={settings.effective_db_user} password={settings.effective_db_password}"
    async with await psycopg.AsyncConnection.connect(conninfo) as conn:
        async with conn.cursor() as cur:
            # Get ALL CC activity names (strip block prefix)
            await cur.execute("""
                SELECT DISTINCT 
                    REGEXP_REPLACE(name, '^Block-\\d+ - ', '') as clean_name
                FROM solar_activities 
                WHERE project_object_id = 4959 
                  AND activity_id LIKE '%%CC%%'
                ORDER BY clean_name
            """)
            names = await cur.fetchall()
            print(f"All CC activity types ({len(names)}):")
            for n in names:
                print(f"  - {n[0]}")
            
            # Also check the block numbers that exist
            await cur.execute("""
                SELECT DISTINCT new_block_nom, plot
                FROM solar_activities 
                WHERE project_object_id = 4959 
                  AND activity_id LIKE '%%CC%%'
                ORDER BY new_block_nom
            """)
            blocks = await cur.fetchall()
            print(f"\nBlocks: {blocks}")

asyncio.run(check(), loop_factory=lambda: asyncio.SelectorEventLoop(selectors.SelectSelector()))
