import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, X, List, Columns, SlidersHorizontal } from 'lucide-react';
import api from '../utils/api';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import TaskDetail from '../components/TaskDetail';
import Modal from '../components/Modal';
import { statusConfig } from '../utils/helpers';
import { useNotifications } from '../context/NotificationContext';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const { showToast } = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('board'); // 'board' | 'list'
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterPriority) params.priority = filterPriority;
      const query = new URLSearchParams(params).toString();
      const data = await api.get(`/tasks${query ? '?' + query : ''}`);
      setTasks(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [search, filterPriority]);

  // Open task from URL param
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && tasks.length > 0) {
      const t = tasks.find(t => t.id === id);
      if (t) openDetail(t.id);
    }
  }, [searchParams, tasks.length]);

  const openDetail = async (id) => {
    try {
      const data = await api.get(`/tasks/${id}`);
      setDetailTask(data);
    } catch {}
  };

  const handleSave = (task) => {
    if (editTask) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      showToast('Task updated', 'success');
    } else {
      setTasks(prev => [task, ...prev]);
      showToast('Task created', 'success');
    }
    setShowForm(false);
    setEditTask(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      setDetailTask(null);
      showToast('Task deleted', 'info');
    } catch {}
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updated = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
    } catch {}
  };

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-gray-200 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9 text-sm" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary btn-sm ${showFilters ? 'border-primary-400 text-primary-600' : ''}`}>
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setView('board')} className={`px-3 py-2 text-sm transition-colors ${view === 'board' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}><Columns className="w-4 h-4" /></button>
            <button onClick={() => setView('list')} className={`px-3 py-2 text-sm transition-colors ${view === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}><List className="w-4 h-4" /></button>
          </div>
          <button onClick={() => { setEditTask(null); setShowForm(true); }} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* Filters bar */}
      {showFilters && (
        <div className="px-8 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-4 animate-fade-in">
          <span className="text-sm text-gray-500 font-medium">Priority:</span>
          {['', 'low', 'medium', 'high', 'urgent'].map(p => (
            <button key={p} onClick={() => setFilterPriority(p)}
              className={`text-sm px-3 py-1 rounded-full border transition-all ${filterPriority === p ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {p || 'All'}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
                {[...Array(3)].map((_, j) => <div key={j} className="h-32 bg-gray-200 rounded-xl animate-pulse" />)}
              </div>
            ))}
          </div>
        ) : view === 'board' ? (
          <div className="grid grid-cols-4 gap-6 min-w-[800px]">
            {COLUMNS.map(col => {
              const colTasks = tasksByStatus(col.key);
              const cfg = statusConfig[col.key];
              return (
                <div key={col.key} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="font-semibold text-gray-700 text-sm">{col.label}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                    </div>
                    <button onClick={() => { setEditTask({ status: col.key }); setShowForm(true); }} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3 min-h-[200px]">
                    {colTasks.map(task => (
                      <TaskCard key={task.id} task={task} onClick={() => openDetail(task.id)} />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 text-sm">
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List view
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Priority</th>
                  <th className="text-left px-4 py-3">Assignee</th>
                  <th className="text-left px-4 py-3">Due</th>
                  <th className="text-left px-4 py-3">Project</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const status = statusConfig[task.status];
                  return (
                    <tr key={task.id} onClick={() => openDetail(task.id)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 text-sm">{task.title}</td>
                      <td className="px-4 py-3"><span className={`badge ${status?.color}`}>{status?.label}</span></td>
                      <td className="px-4 py-3 text-sm capitalize text-gray-600">{task.priority}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{task.assignee_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{task.due_date ? new Date(task.due_date * 1000).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{task.project_name || '—'}</td>
                    </tr>
                  );
                })}
                {tasks.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No tasks found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <Modal title={editTask?.id ? 'Edit Task' : 'New Task'} onClose={() => { setShowForm(false); setEditTask(null); }}>
          <TaskForm initial={editTask || {}} onSave={handleSave} onCancel={() => { setShowForm(false); setEditTask(null); }} />
        </Modal>
      )}

      {detailTask && (
        <Modal title="Task Details" size="lg" onClose={() => setDetailTask(null)}>
          <TaskDetail
            task={detailTask}
            onEdit={(t) => { setEditTask(t); setDetailTask(null); setShowForm(true); }}
            onDelete={handleDelete}
            onClose={() => setDetailTask(null)}
          />
        </Modal>
      )}
    </div>
  );
}
