import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { storageLocationsApi } from '../api/storageLocations';
import type { StorageLocation } from '../types';

export function useStorageLocations() {
  const query = useQuery({ queryKey: ['storage-locations'], queryFn: storageLocationsApi.list });

  const byId = useMemo(() => {
    const map = new Map<string, StorageLocation>();
    (query.data ?? []).forEach((location) => map.set(location.id, location));
    return map;
  }, [query.data]);

  return {
    locations: query.data ?? [],
    byId,
    isLoading: query.isLoading,
  };
}
