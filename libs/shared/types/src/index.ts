// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// API response envelope
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  statusCode: number;
}

// Common entity base
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Identity — shared between gateway and frontend kernel
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}
