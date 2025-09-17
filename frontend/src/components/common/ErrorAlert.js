// frontend/src/components/common/ErrorAlert.js - NEW
import React from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

const ErrorAlert = ({ 
  error, 
  onDismiss, 
  onRetry, 
  contextName = '',
  variant = 'error', // 'error', 'warning', 'info'
  className = ''
}) => {
  if (!error) return null;

  const variants = {
    error: {
      container: 'bg-red-50 border-l-4 border-red-400',
      icon: 'text-red-400',
      text: 'text-red-700',
      button: 'text-red-600 hover:text-red-500'
    },
    warning: {
      container: 'bg-yellow-50 border-l-4 border-yellow-400',
      icon: 'text-yellow-400',
      text: 'text-yellow-700',
      button: 'text-yellow-600 hover:text-yellow-500'
    },
    info: {
      container: 'bg-blue-50 border-l-4 border-blue-400',
      icon: 'text-blue-400',
      text: 'text-blue-700',
      button: 'text-blue-600 hover:text-blue-500'
    }
  };

  const style = variants[variant] || variants.error;

  // Parse error message if it's an object
  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    return 'An unexpected error occurred';
  };

  const errorMessage = getErrorMessage(error);
  const contextPrefix = contextName ? `${contextName}: ` : '';

  return (
    <div className={`${style.container} p-4 mb-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className={`h-5 w-5 ${style.icon}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${style.text}`}>
                {contextPrefix}Error
              </h3>
              <p className={`mt-1 text-sm ${style.text}`}>
                {errorMessage}
              </p>
              
              {/* Additional error details if available */}
              {error?.details && (
                <div className="mt-2">
                  <details className={`text-xs ${style.text} opacity-75`}>
                    <summary className="cursor-pointer hover:opacity-100">
                      Technical Details
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap">{error.details}</pre>
                  </details>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {onRetry && (
                <button
                  type="button"
                  className={`inline-flex items-center space-x-1 text-sm ${style.button} font-medium`}
                  onClick={onRetry}
                >
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
              )}
              
              {onDismiss && (
                <button
                  type="button"
                  className={`inline-flex ${style.button}`}
                  onClick={onDismiss}
                  aria-label="Dismiss error"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;