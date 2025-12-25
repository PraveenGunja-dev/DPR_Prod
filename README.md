# Adani Flow - DPR Management System

Enterprise-grade Daily Progress Report (DPR) management system with Oracle P6 integration.

## Project Structure

```
├── backend/          # Express.js API server
├── frontend/         # React + Vite application
└── docs/             # Documentation
```

## Quick Start

### Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on http://localhost:3000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Application runs on http://localhost:5173

## Deployment

### Backend Deployment

1. Configure environment variables (see `backend/README.md`)
2. Set up PostgreSQL database
3. Run database migrations
4. Deploy with `npm start`

### Frontend Deployment

1. Set `VITE_API_URL` to your backend URL
2. Build with `npm run build`
3. Deploy the `dist` folder to your static hosting

## Features

- **DPR Management** - Daily progress tracking
- **Oracle P6 Integration** - Sync with P6 projects/activities
- **Role-Based Access** - Admin, Supervisor, Super Admin
- **Excel-like Tables** - Handsontable integration
- **Cell Comments** - Collaborative annotations
- **Custom Sheets** - Flexible data entry

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Integration | Oracle P6 REST API |