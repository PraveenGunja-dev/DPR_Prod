import asyncio
import sys
sys.path.insert(0, ".")
from app.database import create_pool

async def check():
    pool = await create_pool()
    pid = 2449

    try:
        mp_rows = await pool.fetch("""
            SELECT contractor_name
            FROM solar_activities sa
            LIMIT 1
        """)
        print("Success! contractor_name exists.")
    except Exception as e:
        print("Error:", e)
    await pool.close()

asyncio.run(check())
