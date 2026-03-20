# Adani Flow - FastAPI Backend

This is the FastAPI backend for the Adani Flow Digitalized DPR system.

## Prerequisites

- Python 3.10+
- PostgreSQL database

## Setup

1. **Create and Activate Virtual Environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```

2. **Install Dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Environment Variables:**
   Ensure you have a `.env` file in the `backend-fastapi` directory with the following variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `SECRET_KEY`: For JWT token generation
   - `PORT`: Port to run the backend on (default: 8000)

## Running the Backend

### Development Mode (with hot-reload)
```powershell
.\venv\Scripts\python -m uvicorn app.main:app --reload
```

### Windows-Specific Note
If you encounter `Psycopg cannot use the 'ProactorEventLoop'` error, use the following command to force the `asyncio` loop:
```powershell
.\venv\Scripts\python -m uvicorn app.main:app --reload --loop asyncio
```

## API Documentation

Once the server is running, you can access:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
