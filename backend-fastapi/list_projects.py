import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def list_projects():
    user = os.getenv("DB_USER", "postgres")
    pwd = os.getenv("DB_PASSWORD", "Prvn@3315")
    host = os.getenv("DB_HOST", "127.0.0.1")
    port = os.getenv("DB_PORT", "5431")
    database = os.getenv("DB_NAME", "postgres")
    
    url = f"postgres://{user}:{pwd}@{host}:{port}/{database}"
    
    conn = await asyncpg.connect(url)
    try:
        rows = await conn.fetch('SELECT "ObjectId", "Id", "Name" FROM p6_projects')
        print("ObjectId | P6Id | Name")
        print("-" * 50)
        for r in rows:
            print(f"{r['ObjectId']} | {r['Id']} | {r['Name']}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(list_projects())
