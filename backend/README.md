# Adani Flow - Backend

Express.js API server with PostgreSQL database.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file with:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=adani_flow
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret

# Server
PORT=3000

# Oracle P6 Integration (Optional)
P6_API_URL=https://your-p6-server.com
P6_USERNAME=your_username
P6_PASSWORD=your_password
```

## Development

```bash
npm run dev
```

Server runs on http://localhost:3000

## Production

```bash
npm start
```

## API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/auth` | Authentication |
| `/api/projects` | Project management |
| `/api/dpr` | DPR entries |
| `/api/activities` | P6 activities |
| `/api/cell-comments` | Cell comments |
| `/api/oracle-p6` | P6 sync operations |

## Database

Run migrations:
```bash
psql -U postgres -d adani_flow -f database/schema.sql
psql -U postgres -d adani_flow -f database/p6-data-schema.sql
```
