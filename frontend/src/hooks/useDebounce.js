// frontend/src/hooks/useDebounce.js - ENHANCED with cleanup
import { useState, useEffect, useRef } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// Advanced debounce hook with cancel functionality
export function useAdvancedDebounce(value, delay, options = {}) {
  const { leading = false, trailing = true, maxWait = null } = options;
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const lastCallTimeRef = useRef(0);
  const lastInvokeTimeRef = useRef(0);

  const cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const now = Date.now();
    lastCallTimeRef.current = now;

    const invokeFunc = () => {
      setDebouncedValue(value);
      lastInvokeTimeRef.current = Date.now();
    };

    // Leading edge
    if (leading && now - lastInvokeTimeRef.current >= delay) {
      invokeFunc();
    }

    // Clear existing timeouts
    cancel();

    // Set trailing timeout
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        if (now === lastCallTimeRef.current) {
          invokeFunc();
        }
      }, delay);
    }

    // Set max wait timeout
    if (maxWait && now - lastInvokeTimeRef.current >= maxWait) {
      invokeFunc();
    } else if (maxWait) {
      const remaining = maxWait - (now - lastInvokeTimeRef.current);
      maxTimeoutRef.current = setTimeout(invokeFunc, remaining);
    }

    return cancel;
  }, [value, delay, leading, trailing, maxWait]);

  return [debouncedValue, cancel];
}

export default useDebounce;