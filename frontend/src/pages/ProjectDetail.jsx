import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Users, UserPlus } from 'lucide-react';
import api from '../utils/api';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import TaskDetail from '../components/TaskDetail';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import { statusConfig } from '../utils/helpers';
import { useNotifications } from '../context/NotificationContext';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { showToast } = useNotifications();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project_id=${id}`),
      api.get('/users'),
    ]).then(([proj, t, users]) => {
      setProject(proj);
      setTasks(t);
      setAllUsers(users);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSave = (task) => {
    if (editTask?.id) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    } else {
      setTasks(prev => [task, ...prev]);
    }
    showToast(editTask?.id ? 'Task updated' : 'Task created', 'success');
    setShowForm(false);
    setEditTask(null);
  };

  const handleDelete = async (tid) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${tid}`);
    setTasks(prev => prev.filter(t => t.id !== tid));
    setDetailTask(null);
    showToast('Task deleted', 'info');
  };

  const openDetail = async (tid) => {
    const data = await api.get(`/tasks/${tid}`);
    setDetailTask(data);
  };

  const addMember = async () => {
    if (!selectedUser) return;
    try {
      await api.post(`/projects/${id}/members`, { user_id: selectedUser });
      const proj = await api.get(`/projects/${id}`);
      setProject(proj);
      setShowAddMember(false);
      setSelectedUser('');
      showToast('Member added', 'success');
    } catch (err) {
      showToast(typeof err === 'string' ? err : 'Failed to add member', 'error');
    }
  };

  if (loading) return <div className="p-8 animate-pulse"><div className="h-10 bg-gray-200 rounded w-48 mb-6" /><div className="grid grid-cols-4 gap-6">{[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-gray-200 rounded-xl" />)}</div></div>;
  if (!project) return <div className="p-8 text-gray-500">Project not found</div>;

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);
  const progress = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link to="/projects" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />
                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              </div>
              {project.description && <p className="text-sm text-gray-500 mt-0.5 ml-7">{project.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Members */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {project.members?.slice(0, 4).map(m => (
                  <Avatar key={m.id} name={m.name} color={m.avatar_color} size="sm" className="ring-2 ring-white" />
                ))}
              </div>
              <button onClick={() => setShowAddMember(true)} className="btn-secondary btn-sm">
                <UserPlus className="w-4 h-4" /> Add
              </button>
            </div>
            {/* Progress */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: project.color, transition: 'width 0.5s' }} />
              </div>
              <span>{progress}%</span>
            </div>
            <button onClick={() => { setEditTask(null); setShowForm(true); }} className="btn-primary btn-sm">
              <Plus className="w-4 h-4" /> Task
            </button>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-4 gap-6 min-w-[800px]">
          {COLUMNS.map(col => {
            const colTasks = tasksByStatus(col.key);
            const cfg = statusConfig[col.key];
            return (
              <div key={col.key} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="font-semibold text-gray-700 text-sm">{col.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                  <button onClick={() => { setEditTask({ status: col.key }); setShowForm(true); }} className="ml-auto text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {colTasks.map(task => (
                    <TaskCard key={task.id} task={task} onClick={() => openDetail(task.id)} />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 text-sm">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <Modal title={editTask?.id ? 'Edit Task' : 'New Task'} onClose={() => { setShowForm(false); setEditTask(null); }}>
          <TaskForm initial={editTask || {}} projectId={id} onSave={handleSave} onCancel={() => { setShowForm(false); setEditTask(null); }} />
        </Modal>
      )}
      {detailTask && (
        <Modal title="Task Details" size="lg" onClose={() => setDetailTask(null)}>
          <TaskDetail task={detailTask} onEdit={(t) => { setEditTask(t); setDetailTask(null); setShowForm(true); }} onDelete={handleDelete} onClose={() => setDetailTask(null)} />
        </Modal>
      )}
      {showAddMember && (
        <Modal title="Add Member" size="sm" onClose={() => setShowAddMember(false)}>
          <div className="space-y-4">
            <select className="input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              <option value="">Select user...</option>
              {allUsers.filter(u => !project.members?.find(m => m.id === u.id)).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
              <button className="btn-primary" onClick={addMember} disabled={!selectedUser}>Add Member</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
