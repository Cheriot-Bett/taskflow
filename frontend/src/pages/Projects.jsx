import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Users, CheckSquare, Pencil, Trash2 } from 'lucide-react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { useNotifications } from '../context/NotificationContext';

function ProjectForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name required'); return; }
    setSaving(true);
    try {
      let result;
      if (initial.id) result = await api.put(`/projects/${initial.id}`, form);
      else result = await api.post('/projects', form);
      onSave(result);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
      <div>
        <label className="label">Project Name *</label>
        <input className="input" placeholder="My Project" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={3} placeholder="What's this project about?" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div>
        <label className="label">Color</label>
        <div className="flex gap-2">
          {colors.map(c => (
            <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
              className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : initial.id ? 'Update' : 'Create Project'}</button>
      </div>
    </form>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then(setProjects).finally(() => setLoading(false));
  }, []);

  const handleSave = (project) => {
    if (editProject) {
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
      showToast('Project updated', 'success');
    } else {
      setProjects(prev => [project, ...prev]);
      showToast('Project created', 'success');
    }
    setShowForm(false);
    setEditProject(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
      showToast('Project deleted', 'info');
    } catch {}
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditProject(null); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No projects yet</h3>
          <p className="mb-6">Create your first project to get started</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Create Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const progress = project.task_count > 0 ? Math.round((project.done_count / project.task_count) * 100) : 0;
            return (
              <div key={project.id} className="card p-6 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/projects/${project.id}`)}>
                {/* Color strip */}
                <div className="h-2 rounded-full mb-4" style={{ backgroundColor: project.color }} />
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{project.name}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditProject(project); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(project.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {project.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><CheckSquare className="w-4 h-4" /> {project.task_count} tasks</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {project.member_count} members</span>
                </div>
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title={editProject ? 'Edit Project' : 'New Project'} onClose={() => { setShowForm(false); setEditProject(null); }}>
          <ProjectForm initial={editProject || {}} onSave={handleSave} onCancel={() => { setShowForm(false); setEditProject(null); }} />
        </Modal>
      )}
    </div>
  );
}
