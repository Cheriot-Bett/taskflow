const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'taskmanager.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode=WAL');
db.exec('PRAGMA foreign_keys=ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    avatar_color TEXT DEFAULT '#6366f1',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    owner_id TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (project_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    project_id TEXT,
    assignee_id TEXT,
    creator_id TEXT NOT NULL,
    due_date INTEGER,
    estimated_hours REAL,
    actual_hours REAL,
    tags TEXT DEFAULT '[]',
    order_index INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    task_id TEXT,
    read INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT DEFAULT '{}',
    created_at INTEGER DEFAULT (unixepoch())
  );
`);

// Helper wrappers to mimic better-sqlite3 API
const prepare = (sql) => {
  const stmt = db.prepare(sql);
  return {
    get: (...params) => stmt.get(...params),
    all: (...params) => stmt.all(...params),
    run: (...params) => stmt.run(...params),
  };
};

const exec = (sql) => db.exec(sql);

const transaction = (fn) => {
  return () => {
    db.exec('BEGIN');
    try { fn(); db.exec('COMMIT'); }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  };
};

// Seed demo data if empty
const userCount = prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('password123', 10);
  const users = [
    { id: uuidv4(), name: 'Alice Johnson', email: 'alice@example.com', color: '#6366f1', role: 'admin' },
    { id: uuidv4(), name: 'Bob Smith', email: 'bob@example.com', color: '#10b981', role: 'member' },
    { id: uuidv4(), name: 'Carol White', email: 'carol@example.com', color: '#f59e0b', role: 'member' },
  ];
  const insertUser = prepare('INSERT INTO users (id, name, email, password_hash, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)');
  users.forEach(u => insertUser.run(u.id, u.name, u.email, hash, u.role, u.color));

  const projectId = uuidv4();
  prepare('INSERT INTO projects (id, name, description, color, owner_id) VALUES (?, ?, ?, ?, ?)')
    .run(projectId, 'Website Redesign', 'Redesign the company website with modern UX', '#6366f1', users[0].id);

  users.forEach(u => {
    prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(projectId, u.id, u.id === users[0].id ? 'owner' : 'member');
  });

  const now = Math.floor(Date.now() / 1000);
  const tasks = [
    { title: 'Design homepage mockups', status: 'done', priority: 'high', assignee: users[1].id, due: now + 86400 * 2 },
    { title: 'Set up CI/CD pipeline', status: 'in_progress', priority: 'high', assignee: users[0].id, due: now + 86400 * 5 },
    { title: 'Write API documentation', status: 'in_progress', priority: 'medium', assignee: users[2].id, due: now + 86400 * 7 },
    { title: 'Implement user authentication', status: 'todo', priority: 'high', assignee: users[1].id, due: now + 86400 * 3 },
    { title: 'Mobile responsive design', status: 'todo', priority: 'medium', assignee: users[2].id, due: now + 86400 * 10 },
    { title: 'Performance optimization', status: 'todo', priority: 'low', assignee: null, due: now + 86400 * 14 },
  ];
  const insertTask = prepare('INSERT INTO tasks (id, title, status, priority, project_id, assignee_id, creator_id, due_date, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  tasks.forEach((t, i) => insertTask.run(uuidv4(), t.title, t.status, t.priority, projectId, t.assignee, users[0].id, t.due, i));
}

const close = () => db.close();

module.exports = { prepare, exec, transaction, close, raw: db };
