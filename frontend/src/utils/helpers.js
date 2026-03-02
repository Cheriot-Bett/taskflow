import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';

export const formatDate = (ts) => {
  if (!ts) return null;
  const d = new Date(ts * 1000);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'MMM d, yyyy');
};

export const formatRelative = (ts) => {
  if (!ts) return null;
  return formatDistanceToNow(new Date(ts * 1000), { addSuffix: true });
};

export const isOverdue = (ts, status) => {
  if (!ts || status === 'done') return false;
  return isPast(new Date(ts * 1000));
};

export const statusConfig = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  review: { label: 'Review', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  done: { label: 'Done', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
};

export const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600', icon: '↓' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700', icon: '→' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700', icon: '↑' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700', icon: '⚡' },
};

export const avatarInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};
