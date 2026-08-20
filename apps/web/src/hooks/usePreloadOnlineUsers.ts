import { useState, useEffect, useCallback, useRef } from 'react';
import { OnlineUser } from '@repo/shared-types';
import { useOnlineUserListStore } from '../states/stores';
import { fetchOnlineUsers } from '../services/api/online-users';

interface UsePreloadOnlineUsersReturn {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  reload: () => Promise<OnlineUser[]>;
}

/**
 * Custom Hook for preloading the initial online users dataset from the API
 * and populating the Zustand store.
 */
export const usePreloadOnlineUsers = (): UsePreloadOnlineUsersReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const { setOnlineUsers } = useOnlineUserListStore();
  const hasFetchedRef = useRef<boolean>(false);

  const fetchAndLoadOnlineUsers = useCallback(async (): Promise<OnlineUser[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchOnlineUsers();
      setOnlineUsers(data);
      setIsLoaded(true);
      return data;
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error('Failed to preload online users');
      setError(errObj);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [setOnlineUsers]);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchAndLoadOnlineUsers();
    }
  }, [fetchAndLoadOnlineUsers]);

  return {
    isLoading,
    isLoaded,
    error,
    reload: fetchAndLoadOnlineUsers,
  };
};
