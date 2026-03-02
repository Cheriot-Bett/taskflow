import { Bell, CheckCheck, MessageSquare, User, Tag, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatRelative } from '../utils/helpers';

const typeIcons = {
  task_assigned: <User className="w-4 h-4 text-indigo-500" />,
  comment: <MessageSquare className="w-4 h-4 text-blue-500" />,
  status_change: <Tag className="w-4 h-4 text-green-500" />,
  deadline: <AlertTriangle className="w-4 h-4 text-orange-500" />,
};

export default function Notifications() {
  const { notifications, unread, markAllRead, fetchNotifications } = useNotifications();

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">{unread > 0 ? `${unread} unread` : 'All caught up!'}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary btn-sm">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium text-gray-500">No notifications yet</p>
          <p className="text-sm mt-1">You'll see task assignments, comments, and updates here</p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-gray-50">
          {notifications.map(n => (
            <div key={n.id} className={`p-4 flex gap-4 transition-colors ${n.read ? 'bg-white' : 'bg-indigo-50/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-gray-100' : 'bg-white shadow-sm'}`}>
                {typeIcons[n.type] || <Bell className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatRelative(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
