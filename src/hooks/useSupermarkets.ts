import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supermarketsApi } from '../api/supermarkets';
import type { Supermarket } from '../types';

export function useSupermarkets() {
  const query = useQuery({ queryKey: ['supermarkets'], queryFn: supermarketsApi.list });

  const byId = useMemo(() => {
    const map = new Map<string, Supermarket>();
    (query.data ?? []).forEach((supermarket) => map.set(supermarket.id, supermarket));
    return map;
  }, [query.data]);

  return {
    supermarkets: query.data ?? [],
    byId,
    isLoading: query.isLoading,
  };
}
