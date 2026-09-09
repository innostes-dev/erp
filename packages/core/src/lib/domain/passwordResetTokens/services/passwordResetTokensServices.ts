import { passwordResetTokensRepositories } from "../repositories";

export function passwordResetTokensServices() {
  const createPasswordResetToken = async (passwordResetTokenData: any) => {
    const result = await passwordResetTokensRepositories().createPasswordResetToken(passwordResetTokenData);
    console.log("Password reset token created successfully:", result);
    return result;
  };

  const updatePasswordResetToken = async (id: string, passwordResetTokenData: any) => {
    const result = await passwordResetTokensRepositories().updatePasswordResetToken(id, passwordResetTokenData);
    console.log("Password reset token updated successfully:", result);
    return result;
  };

  return {
    createPasswordResetToken,
    updatePasswordResetToken,
  };
}
