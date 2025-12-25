# Oracle P6 API Compatibility Guide

This document describes how the Adani Flow API has been adapted to match the Oracle P6 API structure and conventions.

## Key Changes Made

### 1. Endpoint Structure
The API endpoints have been restructured to match Oracle P6 conventions:

**Before (Traditional):**
- `POST /api/auth/login`
- `GET /api/projects/user`
- `GET /api/projects/:id`

**After (Oracle P6 Compatible):**
- `POST /login`
- `GET /project`
- `GET /project/:id`

### 2. Field Naming Conventions
Field names have been updated to match Oracle P6 conventions using PascalCase and Oracle-specific terms:

**Before:**
```json
{
  "id": 1,
  "name": "Project Name",
  "progress": 75,
  "plan_start": "2025-01-01"
}
```

**After:**
```json
{
  "ObjectId": 1,
  "Name": "Project Name",
  "PercentComplete": 75,
  "PlannedStartDate": "2025-01-01"
}
```

### 3. Authentication
The authentication system now supports multiple Oracle P6 compatible methods:

- Bearer token in Authorization header
- Custom token headers (`x-adani-token`, `x-p6-token`)
- Token in query parameters

### 4. Response Format
Responses now include Oracle P6 compatible fields:

```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "ObjectId": 1,
    "Name": "User Name",
    "Email": "user@example.com",
    "Role": "PMAG"
  },
  "sessionId": "jwt_token_here",
  "loginStatus": "SUCCESS"
}
```

## Core Endpoints

- `POST /login`
- `GET /projects/user`
- `GET /projects/:id`

## Authentication Endpoints

- `POST /login` - Authenticate user and return access/refresh tokens
- `POST /register` - Register new user
- `POST /auth/refresh-token` - Refresh access token using refresh token
- `POST /logout` - Invalidate refresh token
- `GET /auth/profile` - Get user profile (requires authentication)

## Project Endpoints

- `GET /project` - Get all projects
- `GET /project/:id` - Get specific project
- `POST /project` - Create new project
- `PUT /project/:id` - Update project
- `DELETE /project/:id` - Delete project

## Activity Endpoints

- `GET /activity` - Get all activities
- `GET /activity/:id` - Get specific activity
- `POST /activity` - Create new activity
- `PUT /activity/:id` - Update activity
- `DELETE /activity/:id` - Delete activity
- `GET /activity/fields` - Get available activity fields

## Project Assignment Endpoints

- `POST /project-assignment/assign` - Assign project to supervisor
- `POST /project-assignment/unassign` - Unassign project from supervisor
- `GET /project-assignment/project/:projectId/supervisors` - Get supervisors for project
- `GET /project-assignment/assigned` - Get assigned projects for supervisor

## Database Schema Changes

### New Tables for Oracle P6 Compatibility
1. `activities` - Stores project activities
2. `wbs` - Work Breakdown Structure
3. `resources` - Project resources
4. `activity_assignments` - Links activities to resources

## Backward Compatibility

All traditional endpoints are still available to ensure backward compatibility with existing clients.

## Testing Oracle P6 Compatibility

Run the test script to verify Oracle P6 API compatibility:
```bash
node server/test-oracle-p6-api.js
```

## Migration Guide

1. Update all API calls to remove the `/api` prefix
2. Update authentication to use `/login` instead of `/auth/login`
3. Implement refresh token handling for long-lived sessions

```javascript
// Login example with refresh token handling
const loginResponse = await fetch('/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials)
});

const { accessToken, refreshToken } = await loginResponse.json();

// Use accessToken for authenticated requests
// Store refreshToken securely for session renewal

// Refresh token example
const refreshResponse = await fetch('/auth/refresh-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});

const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshResponse.json();
```

