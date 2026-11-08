import { apiRequest, getStoredAccessToken } from '@innostes/kernel';

/**
 * Authenticated request to the PeopleOps API (`/peopleops/...`).
 * Every PeopleOps endpoint requires the signed-in user's bearer token.
 */
export function peopleopsRequest<T>(
  path: string,
  init: Omit<RequestInit, 'body'> & { body?: unknown } = {},
): Promise<T> {
  const token = getStoredAccessToken();
  return apiRequest<T>(`/peopleops${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });
}

/** Indian-rupee amount, e.g. ₹14,020.00. */
export const formatINR = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value ?? 0));
