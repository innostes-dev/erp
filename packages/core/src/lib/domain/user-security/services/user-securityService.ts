import { userSecurityRepository } from "../repositories";

export function userSecurityServices() {
  const createUserSecurity = async (userSecurityData: any) => {
    const result = await userSecurityRepository().createUserSecurity(userSecurityData);
    console.log("UserSecurity created successfully:", result);
    return result;
  };
  return {
    createUserSecurity,
  };
}