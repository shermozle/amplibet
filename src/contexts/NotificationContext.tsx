import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { XIcon, CheckCircleIcon, InfoIcon, AlertTriangleIcon } from 'lucide-react';
import { trackNotificationShown } from '../utils/analytics';

// In-app toasts, used for bet settlement (win / loss), withdrawals and session
// messages. Every toast emits 'Notification Shown', so notification pressure is
// itself analysable — the PRD's "win/loss notifications" requirement is as much
// about generating that event stream as about the UI.

export type NotificationType = 'success' | 'info' | 'warning';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  notify: (type: NotificationType, title: string, message: string) => void;
  dismiss: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const AUTO_DISMISS_MS = 6000;

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  // Monotonic counter rather than Math.random: settlement can raise several
  // toasts in one tick, and colliding keys would drop some of them.
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setNotifications(previous => previous.filter(notification => notification.id !== id));
  }, []);

  const notify = useCallback((type: NotificationType, title: string, message: string) => {
    const id = nextId.current++;
    setNotifications(previous => [...previous, { id, type, title, message }]);
    trackNotificationShown(type, title);
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }, [dismiss]);

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const ICONS: Record<NotificationType, typeof InfoIcon> = {
  success: CheckCircleIcon,
  info: InfoIcon,
  warning: AlertTriangleIcon
};

const ACCENTS: Record<NotificationType, string> = {
  success: 'border-accent text-accent',
  info: 'border-raised-light text-paper',
  warning: 'border-salmon text-salmon'
};

// Rendered once, inside Layout, above the routed page. aria-live="polite" so a
// screen reader announces settlements without stealing focus from the slip.
export const ToastViewport: React.FC = () => {
  const { notifications, dismiss } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div aria-live="polite" className="fixed top-16 right-4 z-[60] w-80 space-y-2">
      {notifications.map(notification => {
        const Icon = ICONS[notification.type];
        return (
          <div
            key={notification.id}
            role="status"
            className={`bg-surface border-l-4 ${ACCENTS[notification.type]} rounded shadow-lg p-3 flex items-start`}
          >
            <Icon size={18} className="mt-0.5 mr-2 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{notification.title}</div>
              <div className="text-xs text-gray-300 mt-0.5">{notification.message}</div>
            </div>
            <button
              onClick={() => dismiss(notification.id)}
              className="text-gray-400 hover:text-white ml-2"
              aria-label="Dismiss notification"
            >
              <XIcon size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
