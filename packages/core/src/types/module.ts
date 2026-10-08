import type { Hono } from 'hono';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { InnostesDatabase } from '../db/types.js';

/**
 * Shared runtime context injected by the host server into each module/tool.
 * Database pools, cache clients, logger, and event buses attach here.
 */
export interface ModuleContext<TSchema extends Record<string, unknown> = Record<string, unknown>> {
  db?: InnostesDatabase<TSchema>;
  events?: unknown;
  logger?: {
    info: (msg: string, ...args: unknown[]) => void;
    warn: (msg: string, ...args: unknown[]) => void;
    error: (msg: string, ...args: unknown[]) => void;
  };
}

/**
 * Contract required for any backend module (Kernel service, ERP module, or micro-tool).
 */
export interface PlatformBackendModule<TSchema extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  name: string;
  version?: string;
  /**
   * Called by the host application to mount the module's router.
   */
  registerRoutes: (app: OpenAPIHono<any, any, any> | Hono<any, any, any> | any, ctx: ModuleContext<TSchema>) => void | Promise<void>;
  /**
   * Optional lifecycle hook executed when the host server starts up.
   * Useful for seeding default data, registering event listeners, etc.
   */
  onBoot?: (ctx: ModuleContext<TSchema>) => void | Promise<void>;
  /**
   * Optional lifecycle hook executed during graceful server shutdown.
   */
  onDestroy?: () => void | Promise<void>;
}

export type InnostesOSModule<TSchema extends Record<string, unknown> = Record<string, unknown>> = PlatformBackendModule<TSchema>;