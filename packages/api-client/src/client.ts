import { type Treaty, treaty } from '@elysiajs/eden';
import type { App } from '@repo/api/types';

export type ApiClient = Treaty.Create<App>;

// The return annotation is required: the type Eden infers here isn't portable across packages.
export function createApiClient(baseUrl: string): ApiClient {
  return treaty<App>(baseUrl);
}
