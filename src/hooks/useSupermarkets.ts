import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supermarketsApi } from '../api/supermarkets';
import type { Supermarket } from '../types';

export function useSupermarkets() {
  const query = useQuery({ queryKey: ['supermarkets'], queryFn: supermarketsApi.list });

  const supermarkets = useMemo(
    () => [...(query.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [query.data],
  );

  const byId = useMemo(() => {
    const map = new Map<string, Supermarket>();
    supermarkets.forEach((supermarket) => map.set(supermarket.id, supermarket));
    return map;
  }, [supermarkets]);

  return {
    supermarkets,
    byId,
    isLoading: query.isLoading,
  };
}
