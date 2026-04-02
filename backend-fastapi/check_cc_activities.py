import psycopg
try:
    conn = psycopg.connect('postgresql://postgres:postgres@localhost:5432/dpr_db')
    cur = conn.cursor()
    # Find all solar projects
    cur.execute("SELECT id, name FROM projects WHERE type = 'solar'")
    projects = cur.fetchall()
    print(f"Checking {len(projects)} Solar Projects:")
    for pid, pname in projects:
        # Check CC count (case insensitive)
        cur.execute("SELECT COUNT(activity_id) FROM solar_activities WHERE project_id = %s AND (activity_id ILIKE '%%CC%%' OR name ILIKE '%%CC%%')", (pid,))
        cc_count = cur.fetchone()[0]
        # Check Total count
        cur.execute("SELECT COUNT(activity_id) FROM solar_activities WHERE project_id = %s", (pid,))
        total_count = cur.fetchone()[0]
        
        print(f"Project {pid} ({pname}): CC={cc_count}, Total={total_count}")
        if cc_count == 0 and total_count > 0:
            # Show some samples
            cur.execute("SELECT activity_id, name FROM solar_activities WHERE project_id = %s LIMIT 5", (pid,))
            print(f"  Sample IDs: {cur.fetchall()}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
