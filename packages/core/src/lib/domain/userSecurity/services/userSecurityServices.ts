import { userSecurityRepositories } from "../repositories";

export function userSecurityServices() {
  const createUserSecurity = async (userSecurityData: any) => {
    const result = await userSecurityRepositories().createUserSecurity(userSecurityData);
    console.log("User security created successfully:", result);
    return result;
  };

  const updateUserSecurity = async (userId: string, userSecurityData: any) => {
    const result = await userSecurityRepositories().updateUserSecurity(userId, userSecurityData);
    console.log("User security updated successfully:", result);
    return result;
  };

  return {
    createUserSecurity,
    updateUserSecurity,
  };
}
