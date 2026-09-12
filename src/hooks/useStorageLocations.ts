import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { storageLocationsApi } from '../api/storageLocations';
import type { StorageLocation } from '../types';

export function useStorageLocations() {
  // Le zone cambiano di rado (creazione/rinomina manuale): uno staleTime
  // lungo evita un refetch in background ad ogni cambio schermata, quando
  // il globale di 30s e' pensato per dati che cambiano davvero spesso
  // (scorte, lista della spesa). Le mutazioni che le toccano invalidano
  // gia' esplicitamente questa query, quindi restano comunque aggiornate.
  const query = useQuery({ queryKey: ['storage-locations'], queryFn: storageLocationsApi.list, staleTime: 5 * 60_000 });

  const byId = useMemo(() => {
    const map = new Map<string, StorageLocation>();
    (query.data ?? []).forEach((location) => map.set(location.id, location));
    return map;
  }, [query.data]);

  return {
    locations: query.data ?? [],
    byId,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
