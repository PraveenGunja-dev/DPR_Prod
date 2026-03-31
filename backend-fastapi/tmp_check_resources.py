import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    # Constructing URL manually from .env individual variables
    user = os.getenv("DB_USER", "postgres")
    pwd = os.getenv("DB_PASSWORD", "Prvn@3315")
    host = os.getenv("DB_HOST", "127.0.0.1")
    port = os.getenv("DB_PORT", "5431")
    database = os.getenv("DB_NAME", "postgres")
    
    url = f"postgres://{user}:{pwd}@{host}:{port}/{database}"
    
    print(f"Connecting to {host}:{port}...")
    conn = await asyncpg.connect(url)
    try:
        # Check resource_id patterns
        print("\n--- Resource ID Patterns in solar_resource_assignments ---")
        rows = await conn.fetch("""
            SELECT resource_id, COUNT(*) 
            FROM solar_resource_assignments 
            GROUP BY resource_id 
            ORDER BY COUNT(*) DESC 
            LIMIT 50
        """)
        for r in rows:
            print(f"{r['resource_id']}: {r['count']}")

        # Check for MT resources
        print("\n--- MT Resource Check ---")
        rows = await conn.fetch("""
            SELECT resource_id, COUNT(*) 
            FROM solar_resource_assignments 
            WHERE resource_id ILIKE '%MT%'
            GROUP BY resource_id
        """)
        for r in rows:
            print(f"{r['resource_id']}: {r['count']}")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
