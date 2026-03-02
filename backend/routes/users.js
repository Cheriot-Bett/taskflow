const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/users - list all users (for assignment dropdowns)
router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, avatar_color FROM users ORDER BY name').all();
  res.json(users);
});

// GET /api/users/me
router.get('/me', (req, res) => {
  res.json(req.user);
});

// PUT /api/users/me
router.put('/me', (req, res) => {
  const { name, avatar_color } = req.body;
  const updates = [];
  const params = [];
  if (name) { updates.push('name = ?'); params.push(name); }
  if (avatar_color) { updates.push('avatar_color = ?'); params.push(avatar_color); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  updates.push('updated_at = unixepoch()');
  params.push(req.user.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const user = db.prepare('SELECT id, name, email, role, avatar_color FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

module.exports = router;
