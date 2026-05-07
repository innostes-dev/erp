import 'server-only';
import { cookies, headers } from 'next/headers';
import type { User, ApiResponse } from '@mono/shared/types';

export async function getServerSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const token =
    cookieStore.get('auth_token')?.value ??
    headerStore.get('authorization')?.replace('Bearer ', '');

  if (!token) return null;

  try {
    const apiUrl = process.env['API_URL'] ?? 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;

    const { data } = (await res.json()) as ApiResponse<User>;
    return data;
  } catch {
    return null;
  }
}
