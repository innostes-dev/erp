
import { createDatabaseService } from "../../../database";
import { loginAttempts } from "../../../database/schemas";

export function loginAttemptsRepositories() {
  const createloginAttempts = async (loginAttemptsData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .insert(loginAttempts)
        .values({
          user_id: loginAttemptsData.user_id,
          ip_reputation_id: loginAttemptsData.ip_reputation_id,
          ip_address: loginAttemptsData.ip_address,
          success: loginAttemptsData.success,
          failure_reason: loginAttemptsData.failure_reason ?? null,
          user_agent: loginAttemptsData.user_agent ?? null,
          created_at: new Date(),
        })
        .returning();

    console.log("loginAttempts created successfully:", result);

    return result;
  }
  catch (error) {
    console.error("Error creating loginAttempts:", error);
    throw error;  
  }
  }

  const getloginAttempts = async () => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try{
      const result = await db.select().from(loginAttempts);
      console.log("loginAttempts fetched successfully:", result);
      return result;
    }
    catch (error) {
      console.error("Error fetching loginAttempts:", error);
      throw error;
    }
  }

  return {
    createloginAttempts,
    getloginAttempts,
  }
}