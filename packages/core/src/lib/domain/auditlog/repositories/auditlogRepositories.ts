import { eq } from "drizzle-orm";
import { createDatabaseService } from "../../../database";
import { auditlog } from "../../../database/schemas/auditlog.schema";

export function auditlogRepository() {
  const createAuditLog = async (auditlogData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .insert(auditlog)
        .values({
            "tenant_id": auditlogData.tenant_id,
            "user_id": auditlogData.user_id,
            "action": auditlogData.action,
            "before_value": auditlogData.before_value,
            "after_value": auditlogData.after_value,
            "ip_address": auditlogData.ip_address,
            "user_agent": auditlogData.user_agent,
            "request_id": auditlogData.request_id,
        })
        .returning();

    console.log("Audit log created successfully:", result);

    return result;
  }
  catch (error) {
    console.error("Error creating Auditlog:", error);
    throw error;  
  }
  }

  const getAuditLog = async (id:string) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try{
      const result = await db.select().from(auditlog).where(eq(auditlog.tenant_id,id));
      console.log("Audit log fetched successfully:", result);
      return result;
    }
    catch (error) {
      console.error("Error fetching Auditlog:", error);
      throw error;
    }
  }

  return {
    createAuditLog,
    getAuditLog
  }
}