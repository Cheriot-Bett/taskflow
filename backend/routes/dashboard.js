const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard - summary stats for current user
router.get('/', (req, res) => {
  const userId = req.user.id;
  const now = Math.floor(Date.now() / 1000);

  const myTasks = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE assignee_id = ? AND status != 'done'").get(userId).c;
  const overdue = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE assignee_id = ? AND due_date < ? AND status != 'done'").get(userId, now).c;
  const dueToday = db.prepare('SELECT COUNT(*) as c FROM tasks WHERE assignee_id = ? AND due_date BETWEEN ? AND ?').get(userId, now, now + 86400).c;
  const completedThisWeek = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE assignee_id = ? AND status = 'done' AND updated_at > ?").get(userId, now - 86400 * 7).c;

  const statusBreakdown = db.prepare(
    "SELECT status, COUNT(*) as count FROM tasks WHERE assignee_id = ? GROUP BY status"
  ).all(userId);

  const priorityBreakdown = db.prepare(
    "SELECT priority, COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status != 'done' GROUP BY priority"
  ).all(userId);

  const recentActivity = db.prepare(`
    SELECT a.*, u.name as user_name, t.title as task_title
    FROM activity_log a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN tasks t ON t.id = a.task_id
    WHERE t.assignee_id = ? OR t.creator_id = ? OR a.user_id = ?
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all(userId, userId, userId);

  const upcomingTasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.assignee_id = ? AND t.status != 'done' AND t.due_date IS NOT NULL
    ORDER BY t.due_date ASC
    LIMIT 5
  `).all(userId);

  res.json({
    stats: { myTasks, overdue, dueToday, completedThisWeek },
    statusBreakdown,
    priorityBreakdown,
    recentActivity,
    upcomingTasks
  });
});

module.exports = router;
