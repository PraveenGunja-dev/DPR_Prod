import asyncio
import asyncpg
import json
from datetime import date, datetime

def json_serial(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} is not serializable")

async def check():
    try:
        conn = await asyncpg.connect('postgresql://postgres:Prvn%403315@127.0.0.1:5431/postgres')
        
        # Check projects table
        row = await conn.fetchrow('SELECT * FROM projects LIMIT 1;')
        if row:
            print("--- Sample 'projects' table record ---")
            print(json.dumps(dict(row), indent=2, default=json_serial))
        
        # Check whatever other project table might exist
        tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%project%';")
        for t in tables:
            tname = t['table_name']
            if tname != 'projects':
                try:
                    prow = await conn.fetchrow(f'SELECT * FROM "{tname}" LIMIT 1;')
                    if prow:
                        print(f"\\n--- Sample '{tname}' table record ---")
                        print(json.dumps(dict(prow), indent=2, default=json_serial))
                except Exception:
                    pass

        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(check())
