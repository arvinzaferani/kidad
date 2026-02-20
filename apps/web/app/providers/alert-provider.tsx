'use client';

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

type AlertType = 'success' | 'error' | 'info';

interface AlertItem {
  id: number;
  type: AlertType;
  message: string;
}

interface AlertContextValue {
  showAlert: (message: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const showAlert = useCallback((message: string, type: AlertType = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setAlerts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, 2600);
  }, []);

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <div className="alert-root" aria-live="polite">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-item alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used inside AlertProvider');
  }
  return context;
}
