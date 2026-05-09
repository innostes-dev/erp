import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PublicApi } from '@innostes/core/bridge';
import { db, withTenant } from '@innostes/core/database';
import { employees } from '@innostes/modules/hrms/data-access';

@Injectable()
@PublicApi()
export class HrmsPublicService {
  async getEmployeeInfo(tenantId: string, id: string) {
    const query = withTenant(employees, tenantId, { where: eq(employees.id, id) });
    const [employee] = await db.select().from(employees).where(query.where as never).limit(1);
    return employee ?? null;
  }
}
