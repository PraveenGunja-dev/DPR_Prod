import json, psycopg
try:
    conn = psycopg.connect('postgresql://postgres:postgres@localhost:5432/dpr_db')
    cur = conn.cursor()
    # Find all solar projects
    cur.execute("SELECT id, name FROM projects WHERE type = 'solar' LIMIT 10")
    solar_projects = cur.fetchall()
    print(f"Solar Projects: {solar_projects}")
    
    for pid, pname in solar_projects:
        # Check CC activities for each project
        cur.execute("SELECT COUNT(*) FROM solar_activities WHERE project_id = %s", (pid,))
        total = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM solar_activities WHERE project_id = %s AND (activity_id ILIKE '%%CC%%')", (pid,))
        cc_count = cur.fetchone()[0]
        print(f"Project {pid} ({pname}): Total={total}, CC={cc_count}")
        
        if cc_count == 0 and total > 0:
            # If no CC, show some IDs to see what they use
            cur.execute("SELECT activity_id, name FROM solar_activities WHERE project_id = %s LIMIT 5", (pid,))
            print(f"Sample IDs for {pid}: {cur.fetchall()}")
            
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
