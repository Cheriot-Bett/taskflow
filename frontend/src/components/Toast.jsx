import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const colors = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`animate-slide-in flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm ${colors[t.type] || colors.info}`}>
          {icons[t.type] || icons.info}
          <span className="text-sm font-medium text-gray-800 flex-1">{t.message}</span>
          <button onClick={() => dismissToast(t.id)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
