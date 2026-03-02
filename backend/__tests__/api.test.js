const request = require('supertest');
const path = require('path');

// Use test database
process.env.DB_PATH = path.join(__dirname, '..', 'data', 'test.db');

const app = require('../server');
const { prepare: dbPrepare, close: dbClose, exec: dbExec } = require('../db');

let token;
let userId;
let projectId;
let taskId;

beforeAll(() => {
  // Clean test DB
  dbExec('DELETE FROM notifications');
  dbExec('DELETE FROM activity_log');
  dbExec('DELETE FROM comments');
  dbExec('DELETE FROM tasks');
  dbExec('DELETE FROM project_members');
  dbExec('DELETE FROM projects');
  dbExec('DELETE FROM users');
});

afterAll(() => {
  dbClose();
});

describe('Auth', () => {
  test('POST /api/auth/register - creates user', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test User', email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@test.com');
    token = res.body.token;
    userId = res.body.user.id;
  });

  test('POST /api/auth/register - duplicate email fails', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test User 2', email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  test('POST /api/auth/login - valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login - invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });
});

describe('Projects', () => {
  test('POST /api/projects - creates project', async () => {
    const res = await request(app).post('/api/projects').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', description: 'A test project', color: '#6366f1' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Project');
    projectId = res.body.id;
  });

  test('GET /api/projects - lists projects', async () => {
    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/projects/:id - gets project details', async () => {
    const res = await request(app).get(`/api/projects/${projectId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Project');
    expect(res.body.members).toBeDefined();
  });

  test('PUT /api/projects/:id - updates project', async () => {
    const res = await request(app).put(`/api/projects/${projectId}`).set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Project' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Project');
  });
});

describe('Tasks', () => {
  test('POST /api/tasks - creates task', async () => {
    const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task', description: 'Do something', project_id: projectId, priority: 'high', due_date: Math.floor(Date.now() / 1000) + 86400 });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Task');
    taskId = res.body.id;
  });

  test('GET /api/tasks - lists tasks', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/tasks?project_id - filters by project', async () => {
    const res = await request(app).get(`/api/tasks?project_id=${projectId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test('GET /api/tasks/:id - gets task details', async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Task');
    expect(res.body.comments).toBeDefined();
  });

  test('PUT /api/tasks/:id - updates task status', async () => {
    const res = await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  test('POST /api/tasks/:id/comments - adds comment', async () => {
    const res = await request(app).post(`/api/tasks/${taskId}/comments`).set('Authorization', `Bearer ${token}`)
      .send({ content: 'Working on this now' });
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Working on this now');
  });

  test('DELETE /api/tasks/:id - deletes task', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('Dashboard', () => {
  test('GET /api/dashboard - returns stats', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(res.body.statusBreakdown).toBeDefined();
  });
});

describe('Notifications', () => {
  test('GET /api/notifications - returns notifications', async () => {
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.notifications).toBeDefined();
    expect(typeof res.body.unread).toBe('number');
  });

  test('PUT /api/notifications/read-all - marks all read', async () => {
    const res = await request(app).put('/api/notifications/read-all').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('Auth protection', () => {
  test('GET /api/tasks without token returns 401', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});
