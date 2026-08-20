import { useState, useEffect, useCallback, useRef } from 'react';
import { OnlineUser } from '@repo/shared-types';
import { useOnlineUserListStore } from '../states/stores';

interface UsePreloadOnlineUsersReturn {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  reload: () => Promise<OnlineUser[]>;
}

const STORAGE_KEY = 'bento_online_users_v1';

/**
 * Custom Hook for preloading the initial online users dataset.
 * It simulates or performs the initial fetch, populates the useOnlineUsersStore,
 * and manages local cached persistence if available.
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
      // Check local cache first or fallback to INITIAL_ONLINE_USERS
      const cached = localStorage.getItem(STORAGE_KEY);
      let data: OnlineUser[] = [];

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            data = parsed;
          }
        } catch {
          data = [];
        }
      }

      // Small async tick to simulate seamless non-blocking preload
      await new Promise((resolve) => setTimeout(resolve, 80));

      setOnlineUsers(data);
      setIsLoaded(true);
      return data;
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error('Failed to preload online users');
      setError(errObj);
      // Fallback to initial online users on error
      setOnlineUsers([]);
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
