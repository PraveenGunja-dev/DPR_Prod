import asyncio
import os
import sys

# Script to check database status on the VM
# Run this from the backend-fastapi directory

async def check_db():
    print("Checking Database Connectivity and Schema...")
    sys.path.append(os.getcwd())
    
    try:
        from app.database import create_pool
    except ImportError:
        print("Error: Run from 'backend-fastapi' directory.")
        return

    try:
        pool = await create_pool()
        print("✓ Database pool connected")
        
        # 1. Check core tables
        core_tables = ["users", "projects", "dpr_sheets", "system_logs", "solar_activities"]
        print("\nChecking core tables:")
        for table in core_tables:
            try:
                exists = await pool.fetchval(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}')")
                status = "✓ EXISTS" if exists else "✗ MISSING"
                print(f"  {table:<15}: {status}")
            except Exception as e:
                print(f"  {table:<15}: Error: {e}")

        # 2. Check for users
        try:
            user_count = await pool.fetchval("SELECT count(*) FROM users")
            print(f"\nUser count: {user_count}")
            if user_count > 0:
                admins = await pool.fetch("SELECT name, email, role FROM users WHERE role = 'Super Admin'")
                print(f"Super Admins found: {len(admins)}")
                for a in admins:
                    print(f"  - {a['name']} ({a['email']})")
        except Exception as e:
            print(f"Error checking users: {e}")

        await pool.close()
        print("\nCheck complete!")

    except Exception as e:
        print(f"\nFATAL ERROR connecting to database: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
