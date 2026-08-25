
import { eq } from "drizzle-orm";
import { createDatabaseService } from "../../../database";
import { roles } from "../../../database/schemas";

export function rolesRepositories() {
  const createRole = async (roleData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .insert(roles)
        .values({
          name: roleData.name,
          description: roleData.description ?? null,
          permissions: roleData.permissions
            ? JSON.stringify(roleData.permissions)
            : null,
        })
        .returning();

    console.log("Role created successfully:", result);

    return result;
  }
  catch (error) {
    console.error("Error creating role:", error);
    throw error;  
  }
  }

  const getRoles = async () => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try{
      const result = await db.select().from(roles);
      console.log("Roles fetched successfully:", result);
      return result;
    }
    catch (error) {
      console.error("Error fetching roles:", error);
      throw error;
    }
  }

  const updateRole = async (id:number,roleData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .update(roles)
        .set({
          name: roleData.name,
          description: roleData.description ?? null,
          permissions: roleData.permissions
            ? JSON.stringify(roleData.permissions)
            : null,
        })
        .where(eq(roles.id, id))
        .returning(); 
        return result;
      }
      catch (error) {
        console.error("Error updating role:", error);
        throw error;
      }
    }

    const deleteRole = async (id: number) => {
      const dbService = createDatabaseService();
      const db = dbService.getDb();
      try {
        const result = await db
          .delete(roles)
          .where(eq(roles.id, id))
          .returning();
        return result;
      }
      catch (error) {
        console.error("Error deleting role:", error);
        throw error;
      }
    }

  return {
    createRole,
    getRoles,
    updateRole,
    deleteRole
  }
}