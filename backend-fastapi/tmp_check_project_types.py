import psycopg
import json

try:
    conn = psycopg.connect('postgresql://postgres:Prvn%403315@127.0.0.1:5431/postgres')
    cur = conn.cursor()
    cur.execute('''SELECT "Name", project_type FROM p6_projects WHERE "Name" LIKE '%BESS%' OR "Name" = '++++' LIMIT 10''')
    rows = cur.fetchall()
    for r in rows:
        print(f"Name: {r[0]}, project_type: {r[1]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
