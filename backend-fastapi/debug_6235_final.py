import psycopg
try:
    conn = psycopg.connect('postgresql://postgres:postgres@localhost:5432/dpr_db')
    cur = conn.cursor()
    # Check project type
    cur.execute("SELECT id, name, type FROM projects WHERE id = 6235")
    p = cur.fetchone()
    print(f"Project 6235 Info: {p}")
    
    if p:
        ptype = p[2]
        table_name = "solar_activities" if ptype == "solar" else "wind_activities" if ptype == "wind" else "pss_activities"
        print(f"Checking table: {table_name}")
        
        # Count activities
        cur.execute(f"SELECT COUNT(*) FROM {table_name} WHERE project_id = 6235")
        count = cur.fetchone()[0]
        print(f"Total Activities in {table_name}: {count}")
        
        # Sample IDs
        cur.execute(f"SELECT activity_id, name FROM {table_name} WHERE project_id = 6235 LIMIT 15")
        samples = cur.fetchall()
        print(f"Sample IDs/Names: {samples}")
        
        # Check for CC pattern
        cur.execute(f"SELECT COUNT(*) FROM {table_name} WHERE project_id = 6235 AND (activity_id ILIKE '%%CC%%' OR name ILIKE '%%CC%%')")
        cc_count = cur.fetchone()[0]
        print(f"CC Pattern Matches: {cc_count}")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
