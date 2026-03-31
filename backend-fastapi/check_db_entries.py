
import asyncio
from sqlalchemy import create_engine, text
import json

async def check_db():
    database_url = "postgresql://postgres:Prvn%403315@127.0.0.1:5431/postgres"
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, sheet_type, status, data_json
            FROM dpr_supervisor_entries 
            WHERE sheet_type IN ('dp_qty', 'dp_vendor_idt', 'manpower_details', 'dp_block')
            ORDER BY id DESC LIMIT 20
        """))
        seen = set()
        for row in result:
            if row.sheet_type in seen: continue
            seen.add(row.sheet_type)
            print(f"\nID: {row.id}, Type: {row.sheet_type}")
            try:
                data = json.loads(row.data_json) if isinstance(row.data_json, str) else row.data_json
                if "rows" in data and len(data["rows"]) > 0:
                    print("First row keys:", data["rows"][0].keys())
                    print("First row data:", data["rows"][0])
                if "staticHeader" in data:
                    print("Header:", data["staticHeader"])
            except Exception as e:
                print("Error parsing JSON:", e)

if __name__ == "__main__":
    asyncio.run(check_db())
