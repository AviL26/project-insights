// frontend/src/components/common/DashboardErrorDisplay.js - Error Display System

import React, { useEffect, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useCompliance } from '../../context/ComplianceContext';
import { useToast } from '../../hooks/useToast';
import { AlertTriangle, Info, CheckCircle, RefreshCw, X } from 'lucide-react';

// Enhanced error display component that integrates with all contexts
export const DashboardErrorDisplay = ({ 
  showToasts = true, 
  showInlineErrors = true,
  position = 'top-right' 
}) => {
  const { state: projectState, clearError: clearProjectError } = useProject();
  const { error: complianceError, clearError: clearComplianceError } = useCompliance();
  const { toasts, removeToast, showError, showSuccess, showWarning, showInfo } = useToast();

  const [lastProjectError, setLastProjectError] = useState(null);
  const [lastComplianceError, setLastComplianceError] = useState(null);
  const [lastOperationResult, setLastOperationResult] = useState(null);

  // Handle project context errors
  useEffect(() => {
    if (projectState.error && projectState.error !== lastProjectError && showToasts) {
      showError(projectState.error, { duration: 6000, position });
      setLastProjectError(projectState.error);
    }
  }, [projectState.error, lastProjectError, showError, showToasts, position]);

  // Handle project validation errors
  useEffect(() => {
    if (projectState.validationErrors && showToasts) {
      const message = projectState.validationErrors.message || 'Validation failed';
      const details = projectState.validationErrors.errors 
        ? `: ${projectState.validationErrors.errors.join(', ')}` 
        : '';
      
      showWarning(`${message}${details}`, { duration: 8000, position });
    }
  }, [projectState.validationErrors, showWarning, showToasts, position]);

  // Handle compliance context errors
  useEffect(() => {
    if (complianceError && complianceError !== lastComplianceError && showToasts) {
      showError(`Compliance: ${complianceError}`, { duration: 6000, position });
      setLastComplianceError(complianceError);
    }
  }, [complianceError, lastComplianceError, showError, showToasts, position]);

  // Handle operation success messages
  useEffect(() => {
    if (projectState.lastOperationResult && 
        projectState.lastOperationResult !== lastOperationResult && 
        showToasts) {
      
      const result = projectState.lastOperationResult;
      showSuccess(result.message, { duration: 4000, position });
      setLastOperationResult(result);
    }
  }, [projectState.lastOperationResult, lastOperationResult, showSuccess, showToasts, position]);

  // Inline error display component
  const InlineErrorDisplay = ({ error, onClear, type = 'error', icon: Icon = AlertTriangle }) => {
    if (!error) return null;

    const getErrorStyles = () => {
      switch (type) {
        case 'warning':
          return {
            container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            icon: 'text-yellow-400'
          };
        case 'info':
          return {
            container: 'bg-blue-50 border-blue-200 text-blue-800',
            icon: 'text-blue-400'
          };
        case 'success':
          return {
            container: 'bg-green-50 border-green-200 text-green-800',
            icon: 'text-green-400'
          };
        default:
          return {
            container: 'bg-red-50 border-red-200 text-red-800',
            icon: 'text-red-400'
          };
      }
    };

    const styles = getErrorStyles();

    return (
      <div className={`rounded-lg border p-4 mb-4 ${styles.container}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${styles.icon}`} />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">
              {type === 'error' ? 'Error' : 
               type === 'warning' ? 'Warning' : 
               type === 'info' ? 'Information' : 'Success'}
            </h3>
            <div className="mt-2 text-sm">
              {typeof error === 'string' ? error : error.message || 'Unknown error occurred'}
            </div>
            {error.errors && Array.isArray(error.errors) && (
              <ul className="mt-2 text-sm list-disc list-inside">
                {error.errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            )}
          </div>
          {onClear && (
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={onClear}
                className={`inline-flex rounded-md p-1.5 transition-colors duration-150 hover:bg-opacity-20 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Toast notifications */}
      {showToasts && <ToastManager toasts={toasts} removeToast={removeToast} />}
      
      {/* Inline error displays */}
      {showInlineErrors && (
        <div className="space-y-4">
          {/* Project errors */}
          <InlineErrorDisplay 
            error={projectState.error} 
            onClear={clearProjectError}
            type="error"
            icon={AlertTriangle}
          />
          
          {/* Project validation errors */}
          <InlineErrorDisplay 
            error={projectState.validationErrors} 
            onClear={clearProjectError}
            type="warning"
            icon={AlertTriangle}
          />
          
          {/* Compliance errors */}
          <InlineErrorDisplay 
            error={complianceError} 
            onClear={clearComplianceError}
            type="error"
            icon={AlertTriangle}
          />
          
          {/* Operation success messages */}
          {projectState.lastOperationResult && (
            <InlineErrorDisplay 
              error={projectState.lastOperationResult} 
              onClear={() => {/* Handle clearing operation result */}}
              type="success"
              icon={CheckCircle}
            />
          )}
        </div>
      )}
    </>
  );
};

// Loading state display with operation tracking
export const DashboardLoadingDisplay = () => {
  const { state: projectState } = useProject();
  const { loading: complianceLoading } = useCompliance();

  const isLoading = projectState.isLoading || complianceLoading;
  const operationInProgress = projectState.operationInProgress;

  if (!isLoading && !operationInProgress) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-xl">
        <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
        <div>
          <div className="font-medium text-gray-900">
            {operationInProgress ? 'Processing...' : 'Loading...'}
          </div>
          <div className="text-sm text-gray-500">
            {projectState.lastOperation && (
              <>
                {projectState.lastOperation.type === 'create' && 'Creating project...'}
                {projectState.lastOperation.type === 'bulk_archive' && 'Archiving projects...'}
                {projectState.lastOperation.type === 'bulk_delete' && 'Deleting projects...'}
                {!['create', 'bulk_archive', 'bulk_delete'].includes(projectState.lastOperation.type) && 'Please wait...'}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast display component
const ErrorToast = ({ 
  message, 
  type = 'error', 
  onClose, 
  duration = 5000,
  position = 'top-right' 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible || !message) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: AlertTriangle,
          iconColor: 'text-yellow-400'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: Info,
          iconColor: 'text-blue-400'
        };
      default: // error
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: AlertTriangle,
          iconColor: 'text-red-400'
        };
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const styles = getTypeStyles();
  const IconComponent = styles.icon;

  return (
    <div
      className={`
        fixed z-50 max-w-sm w-full shadow-lg rounded-lg border p-4
        transition-all duration-300 ease-in-out
        ${styles.bg} ${styles.text}
        ${getPositionStyles()}
        ${isExiting 
          ? 'opacity-0 transform translate-x-full' 
          : 'opacity-100 transform translate-x-0'
        }
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${styles.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <div className="text-sm font-medium">
            {message}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleClose}
            className={`
              inline-flex rounded-md p-1.5 transition-colors duration-150
              ${styles.text} hover:bg-opacity-20 hover:bg-gray-600
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
            `}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Manager Component
export const ToastManager = ({ toasts, removeToast }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 80}px)`
          }}
        >
          <ErrorToast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            position={toast.position}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

// Comprehensive dashboard wrapper that includes all error handling
export const DashboardWrapper = ({ 
  children, 
  showToasts = true, 
  showInlineErrors = true,
  showLoadingOverlay = true,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Error displays */}
      <DashboardErrorDisplay 
        showToasts={showToasts} 
        showInlineErrors={showInlineErrors} 
      />
      
      {/* Loading overlay */}
      {showLoadingOverlay && <DashboardLoadingDisplay />}
      
      {/* Main content */}
      {children}
    </div>
  );
};

export default DashboardErrorDisplay;