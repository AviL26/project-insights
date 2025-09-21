// frontend/src/components/common/ErrorAlert.js - ENHANCED GLOBAL ERROR SYSTEM
import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useCompliance } from '../../context/ComplianceContext';
import { AlertTriangle, XCircle, AlertCircle, CheckCircle, X, RefreshCw } from 'lucide-react';

// Global Error Toast Component
export const ErrorToast = ({ error, type = 'error', onClose, onRetry, contextName }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!error) {
      setIsVisible(false);
      return;
    }

    // Auto-dismiss after 8 seconds for non-critical errors
    if (type !== 'error') {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          onClose?.();
        }, 300);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error, type, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible || !error) return null;

  const getIcon = () => {
    switch (type) {
      case 'error': return <XCircle size={20} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-orange-500" />;
      case 'info': return <AlertCircle size={20} className="text-blue-500" />;
      case 'success': return <CheckCircle size={20} className="text-green-500" />;
      default: return <XCircle size={20} className="text-red-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "flex items-start space-x-3 p-4 rounded-lg shadow-lg border max-w-md";
    const typeStyles = {
      error: "bg-red-50 border-red-200",
      warning: "bg-orange-50 border-orange-200", 
      info: "bg-blue-50 border-blue-200",
      success: "bg-green-50 border-green-200"
    };
    const animationStyles = isExiting 
      ? "transform translate-x-full opacity-0 transition-all duration-300"
      : "transform translate-x-0 opacity-100 transition-all duration-300";
    
    return `${baseStyles} ${typeStyles[type]} ${animationStyles}`;
  };

  return (
    <div className={getStyles()}>
      {getIcon()}
      <div className="flex-1">
        {contextName && (
          <div className="text-xs font-medium text-gray-600 mb-1">{contextName}</div>
        )}
        <div className="text-sm text-gray-800 break-words">{error}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        )}
      </div>
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Global Error Toast Container
export const GlobalErrorContainer = () => {
  const { state: projectState, clearError: clearProjectError } = useProject();
  const { error: complianceError, clearError: clearComplianceError, retryLastAnalysis } = useCompliance();
  
  const [displayedErrors, setDisplayedErrors] = useState([]);

  useEffect(() => {
    const errors = [];
    
    if (projectState.error) {
      errors.push({
        id: 'project-error',
        error: projectState.error,
        type: 'error',
        contextName: 'Project Management',
        onClose: clearProjectError,
        onRetry: null
      });
    }

    if (projectState.validationErrors) {
      const validationMessage = typeof projectState.validationErrors === 'string' 
        ? projectState.validationErrors
        : projectState.validationErrors.message || 'Validation failed';
      
      errors.push({
        id: 'project-validation-error',
        error: validationMessage,
        type: 'warning',
        contextName: 'Project Validation',
        onClose: clearProjectError,
        onRetry: null
      });
    }

    if (complianceError) {
      errors.push({
        id: 'compliance-error',
        error: complianceError,
        type: 'error',
        contextName: 'Compliance Analysis',
        onClose: clearComplianceError,
        onRetry: retryLastAnalysis
      });
    }

    setDisplayedErrors(errors);
  }, [projectState.error, projectState.validationErrors, complianceError, clearProjectError, clearComplianceError, retryLastAnalysis]);

  if (displayedErrors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {displayedErrors.map((errorInfo) => (
        <ErrorToast
          key={errorInfo.id}
          error={errorInfo.error}
          type={errorInfo.type}
          contextName={errorInfo.contextName}
          onClose={errorInfo.onClose}
          onRetry={errorInfo.onRetry}
        />
      ))}
    </div>
  );
};

// Enhanced ErrorAlert for specific component use
const ErrorAlert = ({ error, onDismiss, contextName, className = "", showRetry = false, onRetry }) => {
  if (!error) return null;

  return (
    <div className={`mb-4 ${className}`}>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            {contextName && (
              <div className="text-sm font-medium text-red-800 mb-1">{contextName}</div>
            )}
            <div className="text-sm text-red-700">
              {typeof error === 'string' ? error : error.message || 'An error occurred'}
            </div>
            {error.errors && Array.isArray(error.errors) && (
              <ul className="mt-2 list-disc list-inside space-y-1">
                {error.errors.map((err, index) => (
                  <li key={index} className="text-xs text-red-600">{err}</li>
                ))}
              </ul>
            )}
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium flex items-center space-x-1"
              >
                <RefreshCw size={14} />
                <span>Try Again</span>
              </button>
            )}
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;