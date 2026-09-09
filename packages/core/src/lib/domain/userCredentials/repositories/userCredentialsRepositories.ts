import { eq } from "drizzle-orm";
import { createDatabaseService } from "../../../database";
import { userCredentials } from "../../../database/schemas";

export function userCredentialsRepositories() {
  const createUserCredentials = async (userCredentialsData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    const result = await db
      .insert(userCredentials)
      .values({
        user_id: userCredentialsData.user_id,
        password_hash: userCredentialsData.password_hash,
        password_changed_at: new Date(userCredentialsData.password_changed_at),
        created_at: userCredentialsData.created_at,
        updated_at: userCredentialsData.updated_at,
      })
      .returning();

    return result;
  };

  const getUserCredentials = async () => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    return db.select().from(userCredentials);
  };

  const updateUserCredentials = async (id: string, userCredentialsData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    return db
      .update(userCredentials)
      .set({
        user_id: userCredentialsData.user_id,
        password_hash: userCredentialsData.password_hash,
        password_changed_at: new Date(userCredentialsData.password_changed_at),
        updated_at: userCredentialsData.updated_at,
      })
      .where(eq(userCredentials.id, id))
      .returning();
  };

  return {
    createUserCredentials,
    getUserCredentials,
    updateUserCredentials,
  };
}
