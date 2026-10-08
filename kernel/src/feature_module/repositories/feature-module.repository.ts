import { eq, and } from 'drizzle-orm';
import type { InnostesDatabase } from '../../shared/index.js';
import {
  sysModules,
  sysOrgModules,
  type SysModuleTableSelect,
  type SysModuleTableInsert,
  type SysOrgModuleTableSelect,
  type SysOrgModuleTableInsert,
} from '../db/feature-module.table.js';

export class FeatureModuleRepository {
  private memoryModules: Map<string, SysModuleTableSelect> = new Map();
  private memoryOrgModules: Map<string, SysOrgModuleTableSelect> = new Map();

  constructor(private readonly db?: InnostesDatabase<any>) {}

  async createModule(data: SysModuleTableInsert): Promise<SysModuleTableSelect> {
    if (this.db) {
      const [inserted] = await this.db.insert(sysModules).values(data).returning();
      return inserted!;
    }

    const newModule: SysModuleTableSelect = {
      id: data.id,
      name: data.name,
      description: data.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryModules.set(newModule.id, newModule);
    return newModule;
  }

  async findAllModules(): Promise<SysModuleTableSelect[]> {
    if (this.db) {
      return this.db.select().from(sysModules);
    }

    return Array.from(this.memoryModules.values());
  }

  async findModuleById(id: string): Promise<SysModuleTableSelect | null> {
    if (this.db) {
      const [found] = await this.db.select().from(sysModules).where(eq(sysModules.id, id));
      return found || null;
    }

    return this.memoryModules.get(id) || null;
  }

  async findOrgModules(orgId: string): Promise<SysOrgModuleTableSelect[]> {
    if (this.db) {
      return this.db.select().from(sysOrgModules).where(eq(sysOrgModules.orgId, orgId));
    }

    return Array.from(this.memoryOrgModules.values()).filter((om) => om.orgId === orgId);
  }

  async setOrgModuleStatus(data: { orgId: string; moduleId: string; enabled: boolean }): Promise<SysOrgModuleTableSelect> {
    const recordId = `${data.orgId}_${data.moduleId}`;

    if (this.db) {
      const [found] = await this.db
        .select()
        .from(sysOrgModules)
        .where(and(eq(sysOrgModules.orgId, data.orgId), eq(sysOrgModules.moduleId, data.moduleId)));

      if (found) {
        const [updated] = await this.db
          .update(sysOrgModules)
          .set({ enabled: data.enabled, updatedAt: new Date() })
          .where(eq(sysOrgModules.id, found.id))
          .returning();
        return updated!;
      }

      const [inserted] = await this.db
        .insert(sysOrgModules)
        .values({
          id: recordId,
          orgId: data.orgId,
          moduleId: data.moduleId,
          enabled: data.enabled,
        })
        .returning();
      return inserted!;
    }

    const existing = this.memoryOrgModules.get(recordId);
    if (existing) {
      const updated: SysOrgModuleTableSelect = {
        ...existing,
        enabled: data.enabled,
        updatedAt: new Date(),
      };
      this.memoryOrgModules.set(recordId, updated);
      return updated;
    }

    const created: SysOrgModuleTableSelect = {
      id: recordId,
      orgId: data.orgId,
      moduleId: data.moduleId,
      enabled: data.enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.memoryOrgModules.set(recordId, created);
    return created;
  }
}
