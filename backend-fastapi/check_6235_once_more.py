import psycopg
try:
    conn = psycopg.connect('postgresql://postgres:postgres@localhost:5432/dpr_db')
    cur = conn.cursor()
    # 1. Project Info
    cur.execute("SELECT id, name, type FROM projects WHERE id = 6235")
    p = cur.fetchone()
    print(f"Project 6235 Info: {p}")
    
    if p:
        ptype = p[2]
        # 2. Check ANY activity for this project
        for tbl in ['solar_activities', 'wind_activities', 'pss_activities']:
            cur.execute(f"SELECT COUNT(*) FROM {tbl} WHERE project_id = 6235")
            count = cur.fetchone()[0]
            if count > 0:
                print(f"Found {count} activities in table {tbl}")
                cur.execute(f"SELECT activity_id, name FROM {tbl} WHERE project_id = 6235 LIMIT 10")
                print(f"Sample data from {tbl}: {cur.fetchall()}")
                
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
