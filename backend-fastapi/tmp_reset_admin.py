import psycopg
import bcrypt

def reset_admin():
    conn = psycopg.connect('postgresql://postgres:Prvn%403315@127.0.0.1:5431/postgres')
    cur = conn.cursor()
    
    email = 'admin@dpr.com'
    pwd = 'admin123'
    # Hash it
    hashed = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt(rounds=12)).decode()
    
    print(f"Updating {email} with hash: {hashed}")
    
    cur.execute('''
        INSERT INTO users (name, email, password, role, is_active) 
        VALUES ('Super Admin Test', %s, %s, 'Super Admin', true) 
        ON CONFLICT (email) DO UPDATE SET 
            password = EXCLUDED.password, 
            role = 'Super Admin', 
            is_active = true
    ''', (email, hashed))
    
    conn.commit()
    print("Success!")

if __name__ == "__main__":
    reset_admin()
