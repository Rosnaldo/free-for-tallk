import { IRoom } from '@repo/shared-types';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRoomListStore } from '../states/stores';

interface UsePreloadRoomsReturn {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  reload: () => Promise<IRoom[]>;
}

const STORAGE_KEY = 'bento_rooms_state_v1';

/**
 * Custom Hook for preloading the initial room dataset.
 * It simulates or performs the initial fetch, populates the Zustand store,
 * and handles cached persistence if available.
 */
export const usePreloadRooms = (): UsePreloadRoomsReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const { setRooms } = useRoomListStore();
  const hasFetchedRef = useRef<boolean>(false);

  const fetchAndLoadRooms = useCallback(async (): Promise<IRoom[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check local cache first or fallback to INITIAL_ROOMS
      const cached = localStorage.getItem(STORAGE_KEY);
      let data: IRoom[] = [];

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

      setRooms(data);
      setIsLoaded(true);
      return data;
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error('Failed to preload rooms');
      setError(errObj);
      // Fallback to initial rooms on error
      setRooms([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [setRooms]);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchAndLoadRooms();
    }
  }, [fetchAndLoadRooms]);

  return {
    isLoading,
    isLoaded,
    error,
    reload: fetchAndLoadRooms,
  };
};
