import { usersRepository } from "../repositories";

export function usersServices() {
  const createUsers = async (usersData: any) => {
    const result = await usersRepository().createUsers(usersData);
    console.log("Users created successfully:", result);
    return result;
  };
  return {
    createUsers,
  };
}