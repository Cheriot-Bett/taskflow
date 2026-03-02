# TaskFlow – Project Management Tool

A full-stack project management application with task tracking, team collaboration, and deadline management.

## Architecture

```
project-manager/
├── backend/          # Node.js + Express REST API
│   ├── db.js         # SQLite (node:sqlite) database + schema
│   ├── server.js     # Express app entry point
│   ├── middleware/
│   │   └── auth.js   # JWT authentication
│   └── routes/
│       ├── auth.js        # Login / register
│       ├── users.js       # User management
│       ├── projects.js    # Project CRUD + members
│       ├── tasks.js       # Task CRUD + comments + activity
│       ├── notifications.js # In-app notifications
│       └── dashboard.js   # Stats & summary
└── frontend/         # React + Vite + Tailwind CSS
    └── src/
        ├── context/  # Auth + Notification context
        ├── components/ # Reusable UI
        └── pages/    # Route pages
```

## Features

### Task Management
- ✅ Create, edit, delete tasks
- ✅ Status: Todo → In Progress → Review → Done
- ✅ Priority levels: Low, Medium, High, Urgent
- ✅ Due dates with overdue detection
- ✅ Assign tasks to team members
- ✅ Estimated/actual hours tracking
- ✅ Comments on tasks
- ✅ Activity log per task

### Projects
- ✅ Create projects with color coding
- ✅ Kanban board view per project
- ✅ Progress tracking (done/total tasks)
- ✅ Team member management

### Views
- ✅ **Kanban board** – drag-friendly column layout
- ✅ **List view** – tabular with sortable columns
- ✅ **Dashboard** – stats, upcoming tasks, status charts

### Notifications
- ✅ In-app notifications (task assigned, comment, status change)
- ✅ Unread badge in sidebar
- ✅ Toast messages for actions
- ✅ Auto-polls every 30 seconds

### Auth
- ✅ JWT-based login/register
- ✅ Protected routes

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js v22 + Express |
| Database | SQLite via `node:sqlite` (built-in) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| HTTP | Axios |

## Quick Start

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start everything
./start.sh
```

Visit http://localhost:3000

**Demo accounts:**
- `alice@example.com` / `password123` (Admin)
- `bob@example.com` / `password123`
- `carol@example.com` / `password123`

## Running Tests

```bash
cd backend
npm test
```

19 tests covering:
- Auth (register, login, validation)
- Projects (CRUD, members)
- Tasks (CRUD, filters, comments)
- Dashboard stats
- Notifications
- Auth protection
