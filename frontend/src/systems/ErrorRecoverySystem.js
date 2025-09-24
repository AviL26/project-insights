// frontend/src/systems/ErrorRecoverySystem.js - CENTRALIZED ERROR RECOVERY
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useToast } from '../hooks/useToast';

// Error types with recovery strategies
export const ERROR_TYPES = {
  NETWORK: {
    code: 'NETWORK_ERROR',
    retryable: true,
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true
  },
  VALIDATION: {
    code: 'VALIDATION_ERROR', 
    retryable: false,
    userAction: 'fix_input'
  },
  API_SERVER: {
    code: 'API_SERVER_ERROR',
    retryable: true,
    maxRetries: 2,
    retryDelay: 2000
  },
  PERMISSION: {
    code: 'PERMISSION_ERROR',
    retryable: false,
    userAction: 'check_permissions'
  },
  DATA_CORRUPTION: {
    code: 'DATA_CORRUPTION',
    retryable: false,
    recovery: 'reload_page'
  }
};

// Error recovery state
const initialErrorState = {
  activeErrors: new Map(),
  errorHistory: [],
  retryAttempts: new Map(),
  recoveryInProgress: false,
  systemHealthy: true
};

const errorReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ERROR':
      const newActiveErrors = new Map(state.activeErrors);
      newActiveErrors.set(action.payload.id, action.payload);
      
      return {
        ...state,
        activeErrors: newActiveErrors,
        errorHistory: [action.payload, ...state.errorHistory.slice(0, 49)], // Keep last 50
        systemHealthy: false
      };

    case 'REMOVE_ERROR':
      const updatedActiveErrors = new Map(state.activeErrors);
      updatedActiveErrors.delete(action.payload.id);
      
      return {
        ...state,
        activeErrors: updatedActiveErrors,
        systemHealthy: updatedActiveErrors.size === 0
      };

    case 'INCREMENT_RETRY':
      const retryAttempts = new Map(state.retryAttempts);
      retryAttempts.set(action.payload.errorId, (retryAttempts.get(action.payload.errorId) || 0) + 1);
      
      return {
        ...state,
        retryAttempts
      };

    case 'START_RECOVERY':
      return {
        ...state,
        recoveryInProgress: true
      };

    case 'END_RECOVERY':
      return {
        ...state,
        recoveryInProgress: false
      };

    case 'RESET_ERROR_SYSTEM':
      return initialErrorState;

    default:
      return state;
  }
};

// Error Recovery Context
const ErrorRecoveryContext = createContext();

export const ErrorRecoveryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialErrorState);
  const { error: showErrorToast, warning: showWarningToast, success: showSuccessToast } = useToast();

  // Enhanced error reporting with context
  const reportError = useCallback((error, context = {}, options = {}) => {
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Classify error type
    let errorType = ERROR_TYPES.API_SERVER; // default
    
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      errorType = ERROR_TYPES.NETWORK;
    } else if (error.message?.includes('validation') || error.code === 'VALIDATION_ERROR') {
      errorType = ERROR_TYPES.VALIDATION;
    } else if (error.response?.status === 403 || error.response?.status === 401) {
      errorType = ERROR_TYPES.PERMISSION;
    }

    const enhancedError = {
      id: errorId,
      type: errorType,
      message: error.message || 'Unknown error occurred',
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
      severity: options.severity || 'error',
      component: context.component || 'Unknown',
      action: context.action || 'Unknown',
      retryCount: 0,
      canRetry: errorType.retryable && !options.disableRetry
    };

    dispatch({ type: 'ADD_ERROR', payload: enhancedError });

    // Show appropriate toast based on severity
    if (enhancedError.severity === 'warning') {
      showWarningToast(enhancedError.message);
    } else {
      showErrorToast(enhancedError.message);
    }

    // Auto-retry if appropriate
    if (enhancedError.canRetry && options.retryFunction) {
      scheduleRetry(enhancedError, options.retryFunction);
    }

    return errorId;
  }, [showErrorToast, showWarningToast]);

  // Retry mechanism with exponential backoff
  const scheduleRetry = useCallback(async (error, retryFunction) => {
    const currentAttempts = state.retryAttempts.get(error.id) || 0;
    
    if (currentAttempts >= error.type.maxRetries) {
      showErrorToast(`Failed after ${error.type.maxRetries} attempts: ${error.message}`);
      return;
    }

    dispatch({ type: 'INCREMENT_RETRY', payload: { errorId: error.id } });

    const delay = error.type.exponentialBackoff 
      ? error.type.retryDelay * Math.pow(2, currentAttempts)
      : error.type.retryDelay;

    setTimeout(async () => {
      try {
        dispatch({ type: 'START_RECOVERY' });
        await retryFunction();
        
        // Success - remove error
        dispatch({ type: 'REMOVE_ERROR', payload: { id: error.id } });
        showSuccessToast(`Recovered from: ${error.message}`);
      } catch (retryError) {
        // Retry failed - schedule another retry if attempts remain
        const updatedError = { ...error, retryCount: currentAttempts + 1 };
        if (currentAttempts + 1 < error.type.maxRetries) {
          scheduleRetry(updatedError, retryFunction);
        }
      } finally {
        dispatch({ type: 'END_RECOVERY' });
      }
    }, delay);
  }, [state.retryAttempts, showErrorToast, showSuccessToast]);

  // Manual retry function
  const retryError = useCallback(async (errorId, retryFunction) => {
    const error = state.activeErrors.get(errorId);
    if (!error || !error.canRetry) return;

    try {
      dispatch({ type: 'START_RECOVERY' });
      await retryFunction();
      dispatch({ type: 'REMOVE_ERROR', payload: { id: errorId } });
      showSuccessToast('Operation succeeded');
    } catch (retryError) {
      reportError(retryError, { action: 'manual_retry', originalErrorId: errorId });
    } finally {
      dispatch({ type: 'END_RECOVERY' });
    }
  }, [state.activeErrors, showSuccessToast, reportError]);

  // Clear specific error
  const clearError = useCallback((errorId) => {
    dispatch({ type: 'REMOVE_ERROR', payload: { id: errorId } });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    state.activeErrors.forEach((_, errorId) => {
      dispatch({ type: 'REMOVE_ERROR', payload: { id: errorId } });
    });
  }, [state.activeErrors]);

  // System health monitoring
  useEffect(() => {
    const errorCount = state.activeErrors.size;
    const criticalErrors = Array.from(state.activeErrors.values()).filter(
      error => error.severity === 'critical'
    );

    // System degradation detection
    if (errorCount > 5 || criticalErrors.length > 0) {
      console.warn('System health degraded:', { errorCount, criticalErrors });
      
      // Could trigger system-wide recovery actions here
      if (criticalErrors.some(error => error.type === ERROR_TYPES.DATA_CORRUPTION)) {
        showWarningToast('Data integrity issues detected. Please refresh the application.');
      }
    }
  }, [state.activeErrors, showWarningToast]);

  const contextValue = {
    ...state,
    reportError,
    retryError,
    clearError,
    clearAllErrors,
    isSystemHealthy: state.systemHealthy,
    hasActiveErrors: state.activeErrors.size > 0,
    activeErrorCount: state.activeErrors.size
  };

  return (
    <ErrorRecoveryContext.Provider value={contextValue}>
      {children}
    </ErrorRecoveryContext.Provider>
  );
};

export const useErrorRecovery = () => {
  const context = useContext(ErrorRecoveryContext);
  if (!context) {
    throw new Error('useErrorRecovery must be used within an ErrorRecoveryProvider');
  }
  return context;
};

// Higher-order component for automatic error recovery
export const withErrorRecovery = (Component, componentName) => {
  return function ErrorRecoveredComponent(props) {
    const { reportError } = useErrorRecovery();
    
    const handleError = useCallback((error, context = {}) => {
      return reportError(error, { 
        component: componentName,
        ...context 
      });
    }, [reportError]);

    return (
      <Component 
        {...props} 
        onError={handleError}
        reportError={reportError}
      />
    );
  };
};

// Hook for component-level error handling
export const useComponentErrorHandler = (componentName) => {
  const { reportError, retryError, clearError } = useErrorRecovery();
  
  return useCallback((error, context = {}, retryFunction = null) => {
    const errorId = reportError(error, { 
      component: componentName,
      ...context 
    }, { 
      retryFunction,
      severity: error.severity || 'error'
    });
    
    return {
      errorId,
      retry: retryFunction ? () => retryError(errorId, retryFunction) : null,
      dismiss: () => clearError(errorId)
    };
  }, [reportError, retryError, clearError, componentName]);
};