import { userCredentialsRepositories } from "../repositories";

export function userCredentialsServices() {
  const createUserCredentials = async (userCredentialsData: any) => {
    return userCredentialsRepositories().createUserCredentials(userCredentialsData);
  };

  const getUserCredentials = async () => {
    return userCredentialsRepositories().getUserCredentials();
  };

  const updateUserCredentials = async (id: string, userCredentialsData: any) => {
    return userCredentialsRepositories().updateUserCredentials(id, userCredentialsData);
  };

  return {
    createUserCredentials,
    getUserCredentials,
    updateUserCredentials,
  };
}
