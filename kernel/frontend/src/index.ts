/**
 * @innostes/kernel: the kernel's frontend plug-in.
 *
 * - `core`: API client shared by every frontend plug-in.
 * - `setup`: first-run setup wizard and the gate that shows it.
 *
 * Rendered by the UI engine (apps/web-app).
 *
 * @packageDocumentation
 */
export { ApiError, apiRequest, configureApi, getApiConfig, type ApiConfig } from './core/api/client';
export { HttpStatus, isClientError, isServerError, type HttpStatusCode } from './core/api/http-status';
export * from './setup';
