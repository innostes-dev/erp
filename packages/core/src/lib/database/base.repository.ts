import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

export interface IRepository<T, TInsert> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: TInsert): Promise<T>;
  update(id: number, entity: Partial<TInsert>): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}

export abstract class BaseRepository<T extends { id: number }, TInsert, TSchema extends PgTableWithColumns<any>>
  implements IRepository<T, TInsert>
{
  constructor(
    protected db: NodePgDatabase<any>,
    protected table: TSchema
  ) {}

  async findById(id: number): Promise<T | null> {
    const rows = await this.db.select().from(this.table).where(eq(this.table['id'], id)).limit(1);
    return (rows[0] as T) || null;
  }

  async findAll(): Promise<T[]> {
    const rows = await this.db.select().from(this.table);
    return rows as T[];
  }

  async create(entity: TInsert): Promise<T> {
    const rows = await this.db.insert(this.table).values(entity as any).returning();
    return rows[0] as T;
  }

  async update(id: number, entity: Partial<TInsert>): Promise<boolean> {
    const res = await this.db
      .update(this.table)
      .set(entity as any)
      .where(eq(this.table['id'], id))
      .returning();
    return res.length > 0;
  }

  async delete(id: number): Promise<boolean> {
    const res = await this.db.delete(this.table).where(eq(this.table['id'], id)).returning();
    return res.length > 0;
  }
}
