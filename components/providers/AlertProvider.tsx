import { createContext, useContext, useState, ReactNode } from 'react';

interface AlertContextType {
  showAlert: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert debe usarse dentro de AlertProvider');
  return context;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<{ message: string; type: string } | null>(null);

  const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: '12px 24px',
            borderRadius: 8,
            background: alert.type === 'error' ? '#fee2e2' : alert.type === 'success' ? '#d1fae5' : '#e0e7ff',
            color: alert.type === 'error' ? '#b91c1c' : alert.type === 'success' ? '#065f46' : '#3730a3',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {alert.message}
        </div>
      )}
    </AlertContext.Provider>
  );
}
