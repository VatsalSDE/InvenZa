import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`}>
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <p className="flex-1 font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Toast;
