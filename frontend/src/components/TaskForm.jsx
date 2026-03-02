import { useState, useEffect } from 'react';
import api from '../utils/api';

const STATUS_OPTIONS = ['todo', 'in_progress', 'review', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

export default function TaskForm({ initial = {}, projectId, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = {
      title: '', description: '', status: 'todo', priority: 'medium',
      assignee_id: '', due_date: '', estimated_hours: '', tags: [], project_id: projectId || '',
      ...initial,
    };
    // Convert unix timestamp to YYYY-MM-DD string for the date input
    base.due_date = initial.due_date ? new Date(initial.due_date * 1000).toISOString().split('T')[0] : '';
    return base;
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users').then(setUsers).catch(() => {});
    if (!projectId) api.get('/projects').then(setProjects).catch(() => {});
  }, [projectId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        due_date: form.due_date ? Math.floor(new Date(form.due_date).getTime() / 1000) : null,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
        assignee_id: form.assignee_id || null,
        project_id: form.project_id || null,
      };
      let result;
      if (initial.id) {
        result = await api.put(`/tasks/${initial.id}`, payload);
      } else {
        result = await api.post('/tasks', payload);
      }
      onSave(result);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

      <div>
        <label className="label">Title *</label>
        <input className="input" placeholder="Task title..." value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={3} placeholder="Add details..." value={form.description || ''} onChange={e => set('description', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Assignee</label>
          <select className="input" value={form.assignee_id || ''} onChange={e => set('assignee_id', e.target.value)}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Estimated Hours</label>
          <input type="number" step="0.5" min="0" className="input" placeholder="e.g. 4" value={form.estimated_hours || ''} onChange={e => set('estimated_hours', e.target.value)} />
        </div>
        {!projectId && (
          <div>
            <label className="label">Project</label>
            <select className="input" value={form.project_id || ''} onChange={e => set('project_id', e.target.value)}>
              <option value="">No Project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : initial.id ? 'Update Task' : 'Create Task'}</button>
      </div>
    </form>
  );
}
