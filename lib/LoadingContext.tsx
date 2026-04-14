import React, { createContext, useState, useContext, useMemo, useRef, useCallback, useEffect } from 'react';
import { GlobalLoader } from '../components/ui/GlobalLoader';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Set a timeout of 45 seconds to prevent the loader from getting stuck.
const LOADING_TIMEOUT_MS = 45000;

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    // Always clear the previous timeout when this function is called.
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (loading) {
      setIsLoading(true);
      // Set a new timeout. If setLoading(false) isn't called within the duration,
      // it will automatically hide the loader as a failsafe.
      timeoutRef.current = setTimeout(() => {
        // The console warning is removed as per user request.
        // The loader will now hide silently if a timeout occurs.
        // Proper error handling should exist in the component that initiated the loading state.
        setIsLoading(false);
      }, LOADING_TIMEOUT_MS);
    } else {
      // If we are hiding the loader, just update the state.
      // The timeout has already been cleared at the start of the function.
      setIsLoading(false);
    }
  }, []);

  // Effect to clean up the timeout if the component unmounts.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value = useMemo(() => ({
    isLoading,
    setLoading,
  }), [isLoading, setLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isLoading && <GlobalLoader />}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};