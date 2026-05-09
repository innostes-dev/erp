/**
 * libs/shared/src/lib/auth.types.ts
 * Shared authentication types used across the mono-repo.
 */

/** JWT payload — minimal. Role is NEVER here. sid is the device session ID. */
export interface JwtPayload {
  sub: string; // userId
  sid: string; // sessionId (sessions.id)
}

/** Attached to req.tenant by TenantInterceptor after DB verification */
export interface TenantContext {
  tenantId: string;
  branchId?: string;      // Optional — only for branch-scoped modules
  role: string;           // role.name from DB
  permissions: string[];  // role.permissions jsonb array, cast to string[]
}

/** Attached to req.user by AuthGuard after JWT + session DB verification */
export interface UserContext {
  userId: string;
  sessionId: string;      // from JWT sid claim
}

/** One active device session, returned to the client in GET /auth/sessions */
export interface SessionInfo {
  sessionId: string;
  deviceName: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  lastUsedAt: string;
  createdAt: string;
  isCurrent: boolean;     // true if this session matches the caller's req.user.sessionId
}

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError     = { success: false; error: { message: string; code: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
