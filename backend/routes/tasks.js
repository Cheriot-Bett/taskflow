const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function createNotification(userId, type, title, message, taskId) {
  if (!userId) return;
  db.prepare('INSERT INTO notifications (id, user_id, type, title, message, task_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), userId, type, title, message, taskId || null);
}

function logActivity(taskId, userId, action, details = {}) {
  db.prepare('INSERT INTO activity_log (id, task_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), taskId, userId, action, JSON.stringify(details));
}

// GET /api/tasks - with filters
router.get('/', (req, res) => {
  const { project_id, status, priority, assignee_id, search, overdue } = req.query;

  let where = ['1=1'];
  let params = [];

  if (project_id) { where.push('t.project_id = ?'); params.push(project_id); }
  if (status) { where.push('t.status = ?'); params.push(status); }
  if (priority) { where.push('t.priority = ?'); params.push(priority); }
  if (assignee_id) { where.push('t.assignee_id = ?'); params.push(assignee_id); }
  if (search) { where.push('(t.title LIKE ? OR t.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (overdue === 'true') { where.push("t.due_date < unixepoch() AND t.status != 'done'"); }

  const tasks = db.prepare(`
    SELECT t.*,
      u1.name as assignee_name, u1.avatar_color as assignee_color,
      u2.name as creator_name,
      p.name as project_name, p.color as project_color,
      (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assignee_id
    LEFT JOIN users u2 ON u2.id = t.creator_id
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE ${where.join(' AND ')}
    ORDER BY t.order_index ASC, t.created_at DESC
  `).all(...params);

  res.json(tasks);
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, status, priority, project_id, assignee_id, due_date, estimated_hours, tags } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, creator_id, due_date, estimated_hours, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description || null, status || 'todo', priority || 'medium', project_id || null, assignee_id || null, req.user.id, due_date || null, estimated_hours || null, JSON.stringify(tags || []));

  logActivity(id, req.user.id, 'created', { title });

  if (assignee_id && assignee_id !== req.user.id) {
    createNotification(assignee_id, 'task_assigned', 'Task Assigned', `"${title}" was assigned to you by ${req.user.name}`, id);
  }

  const task = db.prepare(`
    SELECT t.*, u1.name as assignee_name, u1.avatar_color as assignee_color, u2.name as creator_name, p.name as project_name
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assignee_id
    LEFT JOIN users u2 ON u2.id = t.creator_id
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(id);

  res.status(201).json(task);
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u1.name as assignee_name, u1.avatar_color as assignee_color, u2.name as creator_name, p.name as project_name, p.color as project_color
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assignee_id
    LEFT JOIN users u2 ON u2.id = t.creator_id
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) return res.status(404).json({ error: 'Task not found' });

  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar_color FROM comments c JOIN users u ON u.id = c.user_id WHERE c.task_id = ? ORDER BY c.created_at ASC
  `).all(req.params.id);

  const activity = db.prepare(`
    SELECT a.*, u.name as user_name FROM activity_log a JOIN users u ON u.id = a.user_id WHERE a.task_id = ? ORDER BY a.created_at DESC LIMIT 20
  `).all(req.params.id);

  res.json({ ...task, comments, activity });
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, status, priority, assignee_id, due_date, estimated_hours, actual_hours, tags } = req.body;
  const changes = {};

  if (title !== undefined && title !== task.title) changes.title = title;
  if (status !== undefined && status !== task.status) changes.status = status;
  if (priority !== undefined && priority !== task.priority) changes.priority = priority;
  if (assignee_id !== undefined && assignee_id !== task.assignee_id) changes.assignee_id = assignee_id;

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      assignee_id = ?,
      due_date = COALESCE(?, due_date),
      estimated_hours = COALESCE(?, estimated_hours),
      actual_hours = COALESCE(?, actual_hours),
      tags = COALESCE(?, tags),
      updated_at = unixepoch()
    WHERE id = ?
  `).run(title || null, description !== undefined ? description : null, status || null, priority || null, assignee_id !== undefined ? assignee_id : task.assignee_id, due_date || null, estimated_hours || null, actual_hours || null, tags ? JSON.stringify(tags) : null, req.params.id);

  if (Object.keys(changes).length > 0) {
    logActivity(req.params.id, req.user.id, 'updated', changes);
  }

  // Notify new assignee
  if (changes.assignee_id && changes.assignee_id !== req.user.id) {
    createNotification(changes.assignee_id, 'task_assigned', 'Task Assigned', `"${task.title}" was assigned to you by ${req.user.name}`, req.params.id);
  }

  // Notify status change to creator
  if (changes.status && task.creator_id !== req.user.id) {
    createNotification(task.creator_id, 'status_change', 'Task Status Updated', `"${task.title}" moved to ${changes.status}`, req.params.id);
  }

  const updated = db.prepare(`
    SELECT t.*, u1.name as assignee_name, u1.avatar_color as assignee_color, u2.name as creator_name, p.name as project_name
    FROM tasks t LEFT JOIN users u1 ON u1.id = t.assignee_id LEFT JOIN users u2 ON u2.id = t.creator_id LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, task_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, req.params.id, req.user.id, content);
  logActivity(req.params.id, req.user.id, 'commented', { preview: content.slice(0, 50) });

  // Notify task assignee
  if (task.assignee_id && task.assignee_id !== req.user.id) {
    createNotification(task.assignee_id, 'comment', 'New Comment', `${req.user.name} commented on "${task.title}"`, req.params.id);
  }

  const comment = db.prepare('SELECT c.*, u.name as user_name, u.avatar_color FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?').get(id);
  res.status(201).json(comment);
});

// PUT /api/tasks/reorder - bulk reorder
router.put('/bulk/reorder', (req, res) => {
  const { tasks } = req.body; // [{id, order_index, status}]
  if (!Array.isArray(tasks)) return res.status(400).json({ error: 'tasks array required' });

  const update = db.prepare('UPDATE tasks SET order_index = ?, status = COALESCE(?, status), updated_at = unixepoch() WHERE id = ?');
  const tx = db.transaction(() => tasks.forEach(t => update.run(t.order_index, t.status || null, t.id)));
  tx();
  res.json({ success: true });
});

module.exports = router;
