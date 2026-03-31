import asyncio
from app.database import get_db, close_pool
from app.routers.notifications import create_notification

async def main():
    pool = await get_db()
    try:
        await create_notification(pool, 59, "Title", "Message", "info", 4959, 1, "test")
        print("Notification created successfully")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await close_pool()

if __name__ == "__main__":
    asyncio.run(main())
