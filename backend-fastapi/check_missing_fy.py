import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    url = os.getenv("DATABASE_URL")
    print(f"Connecting to {url}...")
    conn = await asyncpg.connect(url)
    try:
        # Check p6_projects table
        print("\n--- P6 Projects without FY in Id ---")
        rows = await conn.fetch('SELECT "Id", "Name", "StartDate" FROM p6_projects WHERE "Id" NOT ILIKE \'%FY%\' LIMIT 10')
        for r in rows:
            print(dict(r))

        # Check local projects table
        print("\n--- Local Projects ---")
        rows = await conn.fetch('SELECT id, name, plan_start FROM projects LIMIT 10')
        for r in rows:
            print(dict(r))
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
