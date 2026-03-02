import { useState } from 'react';
import { Edit2, Trash2, Send, Clock, Calendar, User, Tag } from 'lucide-react';
import { statusConfig, priorityConfig, formatDate, formatRelative, isOverdue } from '../utils/helpers';
import Avatar from './Avatar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function TaskDetail({ task: initialTask, onEdit, onDelete, onClose }) {
  const { user } = useAuth();
  const [task, setTask] = useState(initialTask);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const status = statusConfig[task.status] || statusConfig.todo;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const overdue = isOverdue(task.due_date, task.status);

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await api.put(`/tasks/${task.id}`, { status: newStatus });
      setTask({ ...task, ...updated, comments: task.comments, activity: task.activity });
    } catch {}
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const c = await api.post(`/tasks/${task.id}/comments`, { content: comment });
      setTask(t => ({ ...t, comments: [...(t.comments || []), c] }));
      setComment('');
    } catch {} finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`badge ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1`} />
                {status.label}
              </span>
              <span className={`badge ${priority.color}`}>{priority.icon} {priority.label}</span>
              {task.project_name && (
                <span className="badge bg-indigo-50 text-indigo-700">{task.project_name}</span>
              )}
            </div>
            <h1 className={`text-xl font-semibold ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</h1>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onEdit(task)} className="btn-secondary btn-sm"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => onDelete(task.id)} className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        {task.description && <p className="mt-3 text-gray-600 text-sm leading-relaxed">{task.description}</p>}
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
        <div className="space-y-3">
          {task.assignee_name && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Assignee</span>
              <div className="flex items-center gap-1.5 ml-auto">
                <Avatar name={task.assignee_name} color={task.assignee_color} size="xs" />
                <span className="text-sm font-medium">{task.assignee_name}</span>
              </div>
            </div>
          )}
          {task.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Due</span>
              <span className={`text-sm font-medium ml-auto ${overdue ? 'text-red-500' : ''}`}>{formatDate(task.due_date)}</span>
            </div>
          )}
          {task.estimated_hours && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Estimated</span>
              <span className="text-sm font-medium ml-auto">{task.estimated_hours}h</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">Change Status</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(statusConfig).map(([s, cfg]) => (
              <button key={s} onClick={() => handleStatusChange(s)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${task.status === s ? `${cfg.color} border-transparent font-semibold` : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comments */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Comments {task.comments?.length > 0 && <span className="text-gray-400 font-normal">({task.comments.length})</span>}</h3>
        <div className="space-y-3 mb-4">
          {(task.comments || []).map(c => (
            <div key={c.id} className="flex gap-3">
              <Avatar name={c.user_name} color={c.avatar_color} size="sm" />
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{c.user_name}</span>
                  <span className="text-xs text-gray-400">{formatRelative(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700">{c.content}</p>
              </div>
            </div>
          ))}
          {!task.comments?.length && <p className="text-sm text-gray-400 italic">No comments yet</p>}
        </div>
        <form onSubmit={submitComment} className="flex gap-2">
          <Avatar name={user?.name} color={user?.avatar_color} size="sm" />
          <div className="flex-1 flex gap-2">
            <input className="input text-sm" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} />
            <button type="submit" disabled={submitting || !comment.trim()} className="btn-primary btn-sm px-3">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Activity */}
      {task.activity?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Activity</h3>
          <div className="space-y-2">
            {task.activity.map(a => (
              <div key={a.id} className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full flex-shrink-0" />
                <span className="font-medium text-gray-700">{a.user_name}</span>
                <span>{a.action}</span>
                <span className="ml-auto text-xs">{formatRelative(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
