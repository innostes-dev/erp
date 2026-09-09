import { loginAttemptsRepositories } from "../repositories";

export function loginAttemptsServices() {
  const createloginAttempts = async (loginAttemptsData: any) => {
    const result = await loginAttemptsRepositories().createloginAttempts(loginAttemptsData);
    console.log("loginAttempts created successfully:", result);
    return result;
  };

  const getloginAttempts = async () => {
    const result = await loginAttemptsRepositories().getloginAttempts();
    console.log("loginAttempts fetched successfully:", result);
    return result;
    }; 

  return {
    createloginAttempts,
    getloginAttempts,
  };
}