// frontend/src/hooks/useToast.js - Toast Management Hook

import { useState, useCallback } from 'react';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error', options = {}) => {
    const id = ++toastId;
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 5000,
      position: options.position || 'top-right',
      ...options
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove if duration is set
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showError = useCallback((message, options = {}) => {
    return addToast(message, 'error', options);
  }, [addToast]);

  const showSuccess = useCallback((message, options = {}) => {
    return addToast(message, 'success', options);
  }, [addToast]);

  const showWarning = useCallback((message, options = {}) => {
    return addToast(message, 'warning', options);
  }, [addToast]);

  const showInfo = useCallback((message, options = {}) => {
    return addToast(message, 'info', options);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showError,
    showSuccess,
    showWarning,
    showInfo
  };
};