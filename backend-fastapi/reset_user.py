import asyncio
from app.database import get_pool
from app.auth.password import hash_password

async def reset_pass():
    pool = await get_pool()
    email = "praveen@gmail.com"
    new_password = "admin123"
    
    # Generate a fresh hash using our new direct bcrypt method
    hashed = hash_password(new_password)
    
    # Force update the database
    row = await pool.fetchrow(
        "UPDATE users SET password = $1 WHERE LOWER(email) = LOWER($2) RETURNING user_id, email",
        hashed, email
    )
    
    if row:
        print(f"SUCCESS! Password for {row['email']} has been reset to: {new_password}")
    else:
        print("ERROR: User not found in the database. Did the creation step actually succeed?")

if __name__ == "__main__":
    asyncio.run(reset_pass())
