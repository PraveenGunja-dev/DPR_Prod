import asyncio
import sys
import os
import json

# Setup env
sys.path.append(os.getcwd())
os.environ["DB_PORT"] = "5431" # Force local port

from app.database import PoolWrapper, get_db
from app.services.p6_push_service import push_approved_entry_to_p6
import psycopg

async def debug_push(entry_id: int):
    conn_str = "postgresql://postgres:Prvn%403315@127.0.0.1:5431/postgres"
    conn = psycopg.connect(conn_str)
    
    # Mock some dependencies if needed, or just let it run
    # We need a PoolWrapper-like object or a real one
    # Simplest is to use the actual pool
    from app.database import _pool
    if _pool is None:
         from app.database import get_pool
         await get_pool()
    
    from app.database import get_db
    pool = await get_db() # Get the PoolWrapper
    
    print(f"DEBUG: Attempting push for entry {entry_id}...")
    try:
        # Note: We use dry_run=True first to see if it even gets to the P6 call
        result = await push_approved_entry_to_p6(pool, entry_id, pushed_by=1, dry_run=True)
        print(f"DRY RUN RESULT: {json.dumps(result, indent=2)}")
        
        print("\nDEBUG: Attempting REAL push...")
        result = await push_approved_entry_to_p6(pool, entry_id, pushed_by=1, dry_run=False)
        print(f"REAL PUSH RESULT: {json.dumps(result, indent=2)}")
        
    except Exception as e:
        print(f"CRASH: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    entry_id = int(sys.argv[1]) if len(sys.argv) > 1 else 770
    asyncio.run(debug_push(entry_id))
