import { createDatabaseService } from "../../../database";
import {users} from "../../../database/schemas/user.schema"

export function userSecurityRepository() {
  const createUserSecurity = async (userSecurityData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .insert(users)
        .values({
              first_name: userSecurityData.first_name,
              last_name: userSecurityData.last_name,
              middle_name: userSecurityData.middle_name,
              gender: userSecurityData.gender,
              email: userSecurityData.email,
              phone: userSecurityData.phone,
              role_id: userSecurityData.role_id,
        })
        .returning();

    console.log("UserSecurity created successfully:", result);

    return result;
  }
  catch (error) {
    console.error("Error creating userSecurity:", error);
    throw error;  
  }
  }
  return {
    createUserSecurity,
  }
}