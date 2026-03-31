import asyncio
import asyncpg
import sys

async def check():
    try:
        conn = await asyncpg.connect('postgresql://postgres:Prvn%403315@127.0.0.1:5431/postgres')
        query = '''
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'solar_projects';
        '''
        rows = await conn.fetch(query)
        if not rows:
            print("No columns found in solar_projects.")
        else:
            print("Columns in solar_projects:")
            for r in rows:
                print(f"{r['column_name']} ({r['data_type']})")

        # Also check regular projects table if it's different
        query2 = '''
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'projects';
        '''
        rows2 = await conn.fetch(query2)
        if not rows2:
            pass
        else:
            print("\nColumns in projects:")
            for r in rows2:
                print(f"{r['column_name']} ({r['data_type']})")

        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(check())
