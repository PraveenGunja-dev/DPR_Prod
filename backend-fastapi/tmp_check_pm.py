import psycopg

conn = psycopg.connect(host='127.0.0.1', port=5431, dbname='postgres', user='postgres', password='Prvn@3315')
cur = conn.cursor()

# Check submitted entry's project name
cur.execute('SELECT "Name" FROM p6_projects WHERE "ObjectId" = 4959')
print("Project 4959:", cur.fetchone())

# Check PM user IDs
cur.execute("SELECT user_id, name, email, role FROM users WHERE role = 'Site PM'")
pms = cur.fetchall()
print("\nSite PM users:", pms)

# Check if PM has project_assignments
for pm in pms:
    cur.execute("SELECT * FROM project_assignments WHERE user_id = %s", (pm[0],))
    pa = cur.fetchall()
    print(f"\nPM '{pm[1]}' (id={pm[0]}) assignments:", pa)

# Check all entries that are NOT draft
cur.execute("SELECT id, project_id, sheet_type, entry_date, status, supervisor_id FROM dpr_supervisor_entries WHERE status != 'draft' ORDER BY id DESC")
print("\nNon-draft entries:")
for r in cur.fetchall():
    print("  ", r)
