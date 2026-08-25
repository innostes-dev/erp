import { createDatabaseService } from "../../../database";
import { ipReputation } from "../../../database/schemas/ipReputation.schema";

export function ipReputationRepositories() {
  const createIpReputation = async (ipReputationData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .insert(ipReputation)
        .values({
          ip_address: ipReputationData.ip_address,
          risk_score: ipReputationData.risk_score ?? 0,
          status: ipReputationData.status,
          reason: ipReputationData.reason ?? null,
        })
        .returning();

    console.log("IpReputation created successfully:", result);

    return result;
  }
  catch (error) {
    console.error("Error creating ipReputation:", error);
    throw error;  
  }
  }

  return {
    createIpReputation,
  }
}