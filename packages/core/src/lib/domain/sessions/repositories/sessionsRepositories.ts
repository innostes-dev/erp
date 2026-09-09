import { createDatabaseService } from "../../../database";
import { sessions } from "../../../database/schemas";

export function sessionsRepositories() {
  const createSession = async (sessionData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .insert(sessions)
        .values({
          user_id: sessionData.user_id,
          device_id: sessionData.device_id ?? null,
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
          session_token_hash: sessionData.session_token_hash,
          created_at: sessionData.created_at
            ? new Date(sessionData.created_at)
            : undefined,
          expires_at: new Date(sessionData.expires_at),
          last_activity_at: new Date(sessionData.last_activity_at),
          revoked_at: sessionData.revoked_at
            ? new Date(sessionData.revoked_at)
            : null,
          revocation_reason: sessionData.revocation_reason ?? null,
          ip_address: sessionData.ip_address ?? null,
          user_agent: sessionData.user_agent ?? null,
        })
        .returning();

      console.log("Session created successfully:", result);
      return result;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  };

  return {
    createSession,
  };
}
