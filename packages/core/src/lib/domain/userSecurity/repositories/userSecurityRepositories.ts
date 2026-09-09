import { eq } from "drizzle-orm";
import { createDatabaseService } from "../../../database";
import { userSecurity } from "../../../database/schemas";

export function userSecurityRepositories() {
  const createUserSecurity = async (userSecurityData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .insert(userSecurity)
        .values({
          user_id: userSecurityData.user_id,
          failure_count: userSecurityData.failure_count,
          locked_time: new Date(userSecurityData.locked_time),
        })
        .returning();

      console.log("User security created successfully:", result);
      return result;
    } catch (error) {
      console.error("Error creating user security:", error);
      throw error;
    }
  };

  const updateUserSecurity = async (userId: string, userSecurityData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .update(userSecurity)
        .set({
          user_id: userSecurityData.user_id,
          failure_count: userSecurityData.failure_count,
          locked_time: new Date(userSecurityData.locked_time),
        })
        .where(eq(userSecurity.user_id, userId))
        .returning();

      console.log("User security updated successfully:", result);
      return result;
    } catch (error) {
      console.error("Error updating user security:", error);
      throw error;
    }
  };

  return {
    createUserSecurity,
    updateUserSecurity,
  };
}
