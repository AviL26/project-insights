// frontend/src/components/common/ValidatedInput.js - FIXED
import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const ValidatedInput = ({
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  label,
  required = false,
  min,
  max,
  step,
  className = '',
  containerClassName = '',
  error,
  warning,
  helper,
  disabled = false,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);
  const [validationState, setValidationState] = useState(null);

  // Sync with external value changes
  useEffect(() => {
    if (value !== localValue && !isFocused) {
      setLocalValue(value || '');
    }
  }, [value, localValue, isFocused]);

  // FIXED: Wrap validateValue with useCallback to prevent re-creation
  const validateValue = useCallback((val) => {
    if (!hasBeenTouched && !val) return null;
    
    const stringVal = String(val).trim();
    
    // Required field validation
    if (required && !stringVal) {
      return { type: 'error', message: `${label || 'Field'} is required` };
    }
    
    // Skip further validation for empty optional fields
    if (!stringVal && !required) return null;
    
    // Numeric validations
    if (type === 'number') {
      const numVal = parseFloat(stringVal);
      
      if (isNaN(numVal)) {
        return { type: 'error', message: 'Must be a valid number' };
      }
      
      if (min !== undefined && numVal < min) {
        return { type: 'error', message: `Must be at least ${min}` };
      }
      
      if (max !== undefined && numVal > max) {
        return { type: 'error', message: `Must not exceed ${max}` };
      }
      
      // Warnings for unusual values
      if (type === 'number' && label) {
        if (label.toLowerCase().includes('latitude') && (numVal < -90 || numVal > 90)) {
          return { type: 'error', message: 'Latitude must be between -90 and 90 degrees' };
        }
        
        if (label.toLowerCase().includes('longitude') && (numVal < -180 || numVal > 180)) {
          return { type: 'error', message: 'Longitude must be between -180 and 180 degrees' };
        }
        
        if (label.toLowerCase().includes('depth') && numVal > 1000) {
          return { type: 'warning', message: 'Unusually deep - please verify' };
        }
      }
    }
    
    return null;
  }, [hasBeenTouched, required, min, max, label, type]); // Include all dependencies

  // Update validation state when value changes
  useEffect(() => {
    const validation = error ? { type: 'error', message: error } : validateValue(localValue);
    setValidationState(validation);
  }, [localValue, error, validateValue]); // Now validateValue is stable

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (type === 'number') {
      // For number inputs, send the parsed value or null
      const numValue = newValue.trim() === '' ? null : parseFloat(newValue);
      onChange(isNaN(numValue) ? null : numValue, e);
    } else {
      onChange(newValue, e);
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    setHasBeenTouched(true);
    
    if (onBlur) {
      if (type === 'number') {
        const numValue = localValue.trim() === '' ? null : parseFloat(localValue);
        onBlur(isNaN(numValue) ? null : numValue, e);
      } else {
        onBlur(localValue, e);
      }
    }
  };

  // Determine input styling based on validation state
  const getInputClasses = () => {
    let baseClasses = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors';
    
    if (disabled) {
      baseClasses += ' bg-gray-100 cursor-not-allowed opacity-75';
    }
    
    if (validationState?.type === 'error' || error) {
      baseClasses += ' border-red-300 focus:ring-red-500 focus:border-red-500';
    } else if (validationState?.type === 'warning' || warning) {
      baseClasses += ' border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500';
    } else if (hasBeenTouched && localValue && !validationState) {
      baseClasses += ' border-green-300 focus:ring-green-500 focus:border-green-500';
    } else {
      baseClasses += ' border-gray-300 focus:ring-blue-500 focus:border-blue-500';
    }
    
    return baseClasses + (className ? ` ${className}` : '');
  };

  const displayError = error || validationState?.message;
  const displayWarning = warning || (validationState?.type === 'warning' ? validationState.message : null);
  const showSuccess = hasBeenTouched && localValue && !displayError && !displayWarning && !disabled;

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          {...props}
          type={type}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={getInputClasses()}
          aria-invalid={!!(displayError)}
          aria-describedby={
            displayError ? `${props.id || 'input'}-error` :
            displayWarning ? `${props.id || 'input'}-warning` :
            helper ? `${props.id || 'input'}-helper` : undefined
          }
        />
        
        {/* Status icon */}
        {(showSuccess || displayError || displayWarning) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {displayError && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            {displayWarning && !displayError && (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
            {showSuccess && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {displayError && (
        <p 
          id={`${props.id || 'input'}-error`}
          className="text-sm text-red-600 flex items-center space-x-1"
        >
          <AlertCircle size={14} />
          <span>{displayError}</span>
        </p>
      )}
      
      {/* Warning message */}
      {displayWarning && !displayError && (
        <p 
          id={`${props.id || 'input'}-warning`}
          className="text-sm text-yellow-600 flex items-center space-x-1"
        >
          <AlertCircle size={14} />
          <span>{displayWarning}</span>
        </p>
      )}
      
      {/* Helper text */}
      {helper && !displayError && !displayWarning && (
        <p 
          id={`${props.id || 'input'}-helper`}
          className="text-sm text-gray-500"
        >
          {helper}
        </p>
      )}
    </div>
  );
};

// Specialized numeric input component
export const NumericInput = (props) => {
  return (
    <ValidatedInput
      type="number"
      {...props}
    />
  );
};

// Coordinate input with specific validation
export const CoordinateInput = ({ 
  coordinateType = 'latitude', // 'latitude' or 'longitude'
  ...props 
}) => {
  const isLatitude = coordinateType === 'latitude';
  
  return (
    <NumericInput
      min={isLatitude ? -90 : -180}
      max={isLatitude ? 90 : 180}
      step="any"
      placeholder={isLatitude ? "32.0853" : "34.7818"}
      helper={isLatitude ? "Latitude (-90 to 90)" : "Longitude (-180 to 180)"}
      {...props}
    />
  );
};

export default ValidatedInput;