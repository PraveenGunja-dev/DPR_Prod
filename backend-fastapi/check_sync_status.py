import asyncio
import os
import sys
from datetime import datetime

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from app.database import get_pool

async def check():
    pool_wrapper = await get_pool()
    print("Checking database tables...")
    
    # Check current time in DB
    now = await pool_wrapper.fetchval("SELECT NOW()")
    print(f"Current DB time: {now}")
    
    # Check activities synced in last 10 mins
    recent_act = await pool_wrapper.fetchval("SELECT COUNT(*) FROM solar_activities WHERE last_sync_at > NOW() - INTERVAL '10 minutes'")
    print(f"Activities synced in last 10 minutes: {recent_act}")
    
    # Check the MOST RECENT sync timestamp in solar_activities
    last_act_sync = await pool_wrapper.fetchval("SELECT MAX(last_sync_at) FROM solar_activities")
    print(f"Most recent activity sync: {last_act_sync}")

    # Check the MOST RECENT sync timestamp in p6_projects
    last_proj_sync = await pool_wrapper.fetchval('SELECT MAX("LastSyncAt") FROM p6_projects')
    print(f"Most recent project sync: {last_proj_sync}")

if __name__ == "__main__":
    asyncio.run(check())
