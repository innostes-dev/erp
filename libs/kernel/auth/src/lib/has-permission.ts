import type { User } from './auth.types';

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

export function hasAllPermissions(user: User | null, permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(user, p));
}
