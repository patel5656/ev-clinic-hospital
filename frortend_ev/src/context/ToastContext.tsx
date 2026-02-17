import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';
import type { ToastType } from '../components/Toast';

interface ToastMessage {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, title?: string) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((type: ToastType, message: string, title?: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, type, title, message }]);
    }, []);

    const success = (message: string, title?: string) => showToast('success', message, title || 'Success');
    const error = (message: string, title?: string) => showToast('error', message, title || 'Error');
    const warning = (message: string, title?: string) => showToast('warning', message, title || 'Warning');
    const info = (message: string, title?: string) => showToast('info', message, title || 'Information');

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        {...toast}
                        onClose={removeToast}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};
