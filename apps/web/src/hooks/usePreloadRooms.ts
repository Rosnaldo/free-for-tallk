import { IRoom } from '@repo/shared-types';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRoomListStore } from '../states/stores';
import { fetchRooms } from '../services/api/rooms';

interface UsePreloadRoomsReturn {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  reload: () => Promise<IRoom[]>;
}

/**
 * Custom Hook for preloading the initial room dataset from the API
 * and populating the Zustand store.
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
      const data = await fetchRooms();
      setRooms(data);
      setIsLoaded(true);
      return data;
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error('Failed to preload rooms');
      setError(errObj);
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
