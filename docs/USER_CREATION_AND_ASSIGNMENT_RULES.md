# User Creation and Project Assignment Rules

This document outlines the implemented rules for user creation and project assignment in the Adani Flow system.

## User Creation Hierarchy

The system enforces a strict hierarchy for user creation:

1. **PMAG Users** can create:
   - Site PM users
   - Other PMAG users

2. **Site PM Users** can create:
   - Supervisor users

3. **Supervisors** cannot create users

## Project Assignment Rules

Projects can only be assigned at user creation time and cannot be reassigned later:

1. When creating a user, the creator can optionally assign a project to that user
2. Once a project is assigned to a user, it cannot be reassigned to another user
3. If a project needs to be reassigned, a new user must be created

## Implementation Details

### Frontend Changes

1. **PMAG Dashboard** (`src/modules/pmrg/PMRGDashboard.tsx`):
   - Restricted user creation to only Site PM and PMAG roles
   - Added warning text indicating projects can only be assigned at creation time

2. **Site PM Dashboard** (`src/modules/pm/PMDashboard.tsx`):
   - Restricted user creation to only Supervisor role
   - Added warning text indicating projects can only be assigned at creation time

3. **Projects Page** (`src/modules/auth/ProjectsPage.tsx`):
   - Removed separate "Assign Project" functionality
   - Project assignment can only happen during user creation

4. **Navbar** (`src/components/Navbar.tsx`):
   - Conditionally shows "Assign Project" option only for PMAG users

### Backend Changes

1. **Authentication Routes** (`server/routes/auth.js`):
   - Added role-based validation for user creation
   - PMAG users can only create Site PM and PMAG users
   - Site PM users can only create Supervisor users
   - Added informative messages about project assignment rules

2. **Project Assignment Controller** (`server/controllers/projectAssignmentController.js`):
   - Prevents reassignment of projects once assigned
   - Site PM users can only assign projects they have access to
   - Only PMAG users can unassign projects (for administrative purposes)
   - Added informative messages about assignment restrictions

## Key Messages to Users

- "Projects can only be assigned at user creation time"
- "This project cannot be reassigned"
- "Projects can only be reassigned by creating a new user"

These messages appear throughout the UI and API responses to reinforce the rules.