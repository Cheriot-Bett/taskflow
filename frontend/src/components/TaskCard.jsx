import { Calendar, MessageSquare, Clock } from 'lucide-react';
import { statusConfig, priorityConfig, formatDate, isOverdue } from '../utils/helpers';
import Avatar from './Avatar';

export default function TaskCard({ task, onClick, dragging }) {
  const status = statusConfig[task.status] || statusConfig.todo;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div
      onClick={onClick}
      className={`card p-4 cursor-pointer hover:shadow-md transition-all duration-150 group ${dragging ? 'opacity-50 rotate-1 shadow-xl' : ''}`}
    >
      {/* Priority + Tags */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`badge ${priority.color}`}>{priority.icon} {priority.label}</span>
        {task.project_name && (
          <span className="badge bg-indigo-50 text-indigo-700 truncate max-w-[120px]" title={task.project_name}>
            {task.project_name}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className={`font-medium text-gray-900 mb-2 group-hover:text-primary-600 transition-colors ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {task.due_date && (
            <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(task.due_date)}
            </span>
          )}
          {task.comment_count > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {task.comment_count}
            </span>
          )}
          {task.estimated_hours && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {task.estimated_hours}h
            </span>
          )}
        </div>
        {task.assignee_name && (
          <Avatar name={task.assignee_name} color={task.assignee_color} size="xs" />
        )}
      </div>
    </div>
  );
}
