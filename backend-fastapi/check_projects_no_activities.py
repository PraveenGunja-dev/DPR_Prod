
import asyncio
import psycopg
import sys
import os
from dotenv import load_dotenv

# Add current dir to path to import app if needed
sys.path.append(os.getcwd())

load_dotenv()

async def check_activities():
    from app.config import settings
    
    conninfo = settings.DATABASE_URL or f"host={settings.effective_db_host} port={settings.effective_db_port} dbname={settings.effective_db_name} user={settings.effective_db_user} password={settings.effective_db_password}"
    
    async with await psycopg.AsyncConnection.connect(conninfo) as conn:
        async with conn.cursor() as cur:
            # Get all projects
            await cur.execute('SELECT "ObjectId", "Id", "Name" FROM p6_projects')
            projects = await cur.fetchall()
            
            # Get activity tables
            await cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%activities%'")
            tables_rows = await cur.fetchall()
            activity_tables = [r[0] for r in tables_rows]
            
            print(f"Found activity tables: {activity_tables}")
            
            projects_with_no_activities = []
            
            for p_obj_id, p_id, p_name in projects:
                total_activities = 0
                
                for table in activity_tables:
                    # Check for column names in the table
                    await cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'")
                    cols = await cur.fetchall()
                    col_names = [c[0] for c in cols]
                    
                    project_col = None
                    if 'ProjectObjectId' in col_names:
                        project_col = '"ProjectObjectId"'
                    elif 'project_object_id' in col_names:
                        project_col = 'project_object_id'
                    
                    if project_col:
                        await cur.execute(f"SELECT count(*) FROM {table} WHERE {project_col} = %s", (p_obj_id,))
                        count = await cur.fetchone()
                        total_activities += count[0]
                
                if total_activities == 0:
                    projects_with_no_activities.append((p_id, p_name, p_obj_id))
            
            print("\nProjects with NO activities:")
            print("-" * 50)
            if not projects_with_no_activities:
                print("None found.")
            for p_id, p_name, p_obj_id in projects_with_no_activities:
                print(f"ID: {p_id} | Name: {p_name} | ObjectId: {p_obj_id}")

if __name__ == "__main__":
    import selectors
    asyncio.run(check_activities(), loop_factory=lambda: asyncio.SelectorEventLoop(selectors.SelectSelector()))
