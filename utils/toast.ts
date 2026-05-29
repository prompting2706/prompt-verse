export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

type Listener = (item: ToastItem) => void;
let listeners: Listener[] = [];

const show = (message: string, type: ToastType): void => {
  const item: ToastItem = { id: `t-${Date.now()}-${Math.random()}`, message, type };
  listeners.forEach(fn => fn(item));
};

export const toast = {
  success: (msg: string) => show(msg, 'success'),
  error:   (msg: string) => show(msg, 'error'),
  info:    (msg: string) => show(msg, 'info'),
  warning: (msg: string) => show(msg, 'warning'),
  _subscribe: (fn: Listener) => {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  },
};
