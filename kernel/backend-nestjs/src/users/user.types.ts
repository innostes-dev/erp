export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'scanner' | 'kiosk';
export const DEVICE_TYPES: DeviceType[] = ['desktop', 'mobile', 'tablet', 'scanner', 'kiosk'];

export interface UserRow {
  id: string;
  first_name: string;
  last_name: string | null;
  email_hash: string;
  email_encrypted: string;
  mobile_hash: string | null;
  mobile_encrypted: string | null;
  password_hash: string;
  status: UserStatus;
  is_super_admin: boolean;
  must_change_password: boolean;
  temp_password_expires_at: Date | null;
  token_version: number;
  failed_login_attempts: number;
  blocked_until: Date | null;
  key_version: number;
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
  deleted_at: Date | null;
  deleted_by: string | null;
}

export interface UserRead {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  mobile: string | null;
  status: UserStatus;
  is_super_admin: boolean;
  token_version: number;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface DeviceRow {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string;
  device_type: DeviceType;
  status: 'active' | 'pending_approval' | 'blocked' | 'wiped';
}

/** `true` when the account is suspended or temporarily locked. */
export function isBlocked(user: Pick<UserRow, 'status' | 'blocked_until'>, now = new Date()): boolean {
  if (user.status === 'suspended') return true;
  return user.blocked_until !== null && user.blocked_until.getTime() > now.getTime();
}
