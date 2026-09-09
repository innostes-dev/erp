import { eq } from "drizzle-orm";
import { createDatabaseService } from "../../../database";
import { passwordResetTokens } from "../../../database/schemas";

export function passwordResetTokensRepositories() {
  const createPasswordResetToken = async (passwordResetTokenData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .insert(passwordResetTokens)
        .values({
          user_id: passwordResetTokenData.user_id,
          token_hash: passwordResetTokenData.token_hash,
          created_at: passwordResetTokenData.created_at
            ? new Date(passwordResetTokenData.created_at)
            : undefined,
          expires_at: new Date(passwordResetTokenData.expires_at),
          used_at: passwordResetTokenData.used_at
            ? new Date(passwordResetTokenData.used_at)
            : null,
          request_ip: passwordResetTokenData.request_ip ?? null,
          user_agent: passwordResetTokenData.user_agent ?? null,
        })
        .returning();

      console.log("Password reset token created successfully:", result);
      return result;
    } catch (error) {
      console.error("Error creating password reset token:", error);
      throw error;
    }
  };

  const updatePasswordResetToken = async (id: string, passwordResetTokenData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .update(passwordResetTokens)
        .set({
          user_id: passwordResetTokenData.user_id,
          token_hash: passwordResetTokenData.token_hash,
          expires_at: new Date(passwordResetTokenData.expires_at),
          used_at: passwordResetTokenData.used_at
            ? new Date(passwordResetTokenData.used_at)
            : null,
          request_ip: passwordResetTokenData.request_ip ?? null,
          user_agent: passwordResetTokenData.user_agent ?? null,
        })
        .where(eq(passwordResetTokens.id, id))
        .returning();

      console.log("Password reset token updated successfully:", result);
      return result;
    } catch (error) {
      console.error("Error updating password reset token:", error);
      throw error;
    }
  };

  return {
    createPasswordResetToken,
    updatePasswordResetToken,
  };
}
