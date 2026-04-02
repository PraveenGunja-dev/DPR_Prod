import psycopg
try:
    conn = psycopg.connect('postgresql://postgres:postgres@localhost:5432/dpr_db')
    cur = conn.cursor()
    
    # Get project info
    cur.execute("SELECT id, name, type FROM projects WHERE id = 6235")
    p = cur.fetchone()
    print(f"Project 6235: {p}")
    
    # Sample activities
    cur.execute("SELECT activity_id, name FROM solar_activities WHERE project_id = 6235 LIMIT 15")
    samples = cur.fetchall()
    print(f"Sample Activities (6235): {samples}")
    
    # CC check
    cur.execute("SELECT COUNT(activity_id) FROM solar_activities WHERE project_id = 6235 AND (activity_id ILIKE '%%CC%%' OR name ILIKE '%%CC%%')")
    cc_count = cur.fetchone()[0]
    print(f"CC Count (ILIKE '%%CC%%'): {cc_count}")
    
    # Total check
    cur.execute("SELECT COUNT(activity_id) FROM solar_activities WHERE project_id = 6235")
    total_count = cur.fetchone()[0]
    print(f"Total Count: {total_count}")
    
    cur.close()
    conn.close()
except Exception as e:
    print(e)
