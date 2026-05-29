import React, { useState, useEffect, useCallback } from 'react';
import { toast, type ToastItem } from '../utils/toast';

const BG: Record<ToastItem['type'], string> = {
  success: 'bg-green-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
  warning: 'bg-amber-500',
};

const ICON: Record<ToastItem['type'], string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
};

const ToastContainer: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    return toast._subscribe(item => {
      setItems(prev => [...prev, item]);
      setTimeout(() => remove(item.id), 3800);
    });
  }, [remove]);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {items.map(item => (
        <div
          key={item.id}
          className={`flex items-center gap-3 ${BG[item.type]} text-white px-4 py-3 rounded-lg shadow-xl min-w-56 max-w-sm pointer-events-auto`}
          style={{ animation: 'slideInRight 0.25s ease' }}
        >
          <span className="font-bold text-base leading-none">{ICON[item.type]}</span>
          <span className="text-sm font-medium flex-1">{item.message}</span>
          <button
            onClick={() => remove(item.id)}
            className="text-white/70 hover:text-white text-lg leading-none ml-1"
          >
            ×
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
