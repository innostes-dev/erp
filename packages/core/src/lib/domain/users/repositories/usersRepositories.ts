import { createDatabaseService } from "../../../database";
import {users} from "../../../database/schemas/user.schema"

export function usersRepository() {
  const createUsers = async (usersData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .insert(users)
        .values({
              first_name: usersData.first_name,
              last_name: usersData.last_name,
              middle_name: usersData.middle_name,
              gender: usersData.gender,
              email: usersData.email,
              phone: usersData.phone,
              role_id: usersData.role_id,
        })
        .returning();

    console.log("Users created successfully:", result);

    return result;
  }
  catch (error) {
    console.error("Error creating users:", error);
    throw error;  
  }
  }
  return {
    createUsers,
  }
}