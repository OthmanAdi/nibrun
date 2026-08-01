import { queryOptions } from '@tanstack/react-query';
import { api } from '#lib/api.ts';

const REFETCH_INTERVAL_MS = 5_000;

export const healthQueryOptions = queryOptions({
  queryKey: ['health'],
  queryFn: async () => {
    const { data, error } = await api.api.health.get();
    if (error) {
      throw error;
    }
    return data;
  },
  refetchInterval: REFETCH_INTERVAL_MS,
});
