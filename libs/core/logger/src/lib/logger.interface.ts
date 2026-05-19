/**
 * libs/core/logger/src/lib/logger.interface.ts
 *
 * Bridge interface. Re-exports contracts from standalone @innostes/logger package.
 */
export { IApiLogData, ILogTransport } from '@innostes/logger';
export const LOG_TRANSPORTS = Symbol('LOG_TRANSPORTS');
