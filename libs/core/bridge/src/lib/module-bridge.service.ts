import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { db, moduleRegistry } from '@innostes/core/database';
import { and, eq } from 'drizzle-orm';

export type BridgeHandler = {
  moduleId: string;
  isLoaded: boolean;
  api: Record<string, (...args: unknown[]) => unknown | Promise<unknown>>;
};

@Injectable()
export class ModuleBridge {
  private readonly logger = new Logger(ModuleBridge.name);
  private readonly handlers = new Map<string, BridgeHandler>();

  constructor(@Optional() @Inject('BRIDGE_HANDLERS') handlers?: BridgeHandler[]) {
    handlers?.forEach((handler) => this.handlers.set(handler.moduleId, handler));
  }

  register(handler: BridgeHandler): void {
    this.handlers.set(handler.moduleId, handler);
  }

  async invoke<TResponse = unknown>(
    tenantId: string,
    moduleId: string,
    method: string,
    ...args: unknown[]
  ): Promise<TResponse | null> {
    const [row] = await db
      .select({ isEnabled: moduleRegistry.isEnabled })
      .from(moduleRegistry)
      .where(and(eq(moduleRegistry.tenantId, tenantId), eq(moduleRegistry.moduleId, moduleId)))
      .limit(1);

    if (!row?.isEnabled) {
      return null;
    }

    const handler = this.handlers.get(moduleId);
    if (!handler || !handler.isLoaded) {
      return null;
    }

    const fn = handler.api[method];
    if (!fn) {
      this.logger.warn(`Bridge method not found: ${moduleId}.${method}`);
      return null;
    }

    return (await fn(...args)) as TResponse;
  }
}
