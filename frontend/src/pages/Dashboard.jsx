import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, AlertTriangle, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { formatDate, statusConfig, priorityConfig, isOverdue } from '../utils/helpers';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}</div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CheckSquare} label="Active Tasks" value={data?.stats?.myTasks ?? 0} color="bg-indigo-100 text-indigo-600" />
        <StatCard icon={AlertTriangle} label="Overdue" value={data?.stats?.overdue ?? 0} color="bg-red-100 text-red-600" sub={data?.stats?.overdue > 0 ? 'Need attention' : ''} />
        <StatCard icon={Clock} label="Due Today" value={data?.stats?.dueToday ?? 0} color="bg-amber-100 text-amber-600" />
        <StatCard icon={TrendingUp} label="Done This Week" value={data?.stats?.completedThisWeek ?? 0} color="bg-green-100 text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Upcoming Tasks</h2>
            <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">View all <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {data?.upcomingTasks?.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No upcoming tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.upcomingTasks?.map(task => {
                const priority = priorityConfig[task.priority];
                const overdue = isOverdue(task.due_date, task.status);
                return (
                  <Link key={task.id} to={`/tasks?id=${task.id}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`badge text-xs ${priority?.color}`}>{priority?.icon} {priority?.label}</span>
                        {task.project_name && <span className="text-xs text-gray-400">{task.project_name}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-gray-500'}`}>{formatDate(task.due_date)}</p>
                      {task.assignee_name && <Avatar name={task.assignee_name} color={task.assignee_color} size="xs" className="mt-1 ml-auto" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Task Status</h2>
          <div className="space-y-3">
            {Object.entries(statusConfig).map(([key, cfg]) => {
              const count = data?.statusBreakdown?.find(s => s.status === key)?.count || 0;
              const total = data?.statusBreakdown?.reduce((a, s) => a + s.count, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{cfg.label}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          {data?.recentActivity?.length > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3 text-sm">Recent Activity</h3>
              <div className="space-y-2">
                {data.recentActivity.slice(0, 5).map(a => (
                  <div key={a.id} className="text-xs text-gray-500 flex items-start gap-2">
                    <span className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 flex-shrink-0" />
                    <span><strong className="text-gray-700">{a.user_name}</strong> {a.action} {a.task_title && <em>"{a.task_title}"</em>}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
