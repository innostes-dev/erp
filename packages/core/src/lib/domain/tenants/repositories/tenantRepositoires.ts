
import { eq } from "drizzle-orm";
import { createDatabaseService } from "../../../database";
import { tenant } from "../../../database/schemas/tenant.schema";

export function tenantRepositories() {
  const createTenant = async (tenantData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .insert(tenant)
        .values({
            name: tenantData.name,
            slug: tenantData.slug,
            address: tenantData.address ?? null,
            logo_url: tenantData.logo_url ?? null,
        })
        .returning();

    console.log("Tenant created successfully:", result);

    return result;
  }
  catch (error) {
    console.error("Error creating tenant:", error);
    throw error;  
  }
  }

  const getTenants = async () => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try{
      const result = await db.select().from(tenant);
      console.log("Tenants fetched successfully:", result);
      return result;
    }
    catch (error) {
      console.error("Error fetching roles:", error);
      throw error;
    }
  }

  const updateTenant = async (id:string,tenantData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .update(tenant)
        .set({
          name: tenantData.name,
          slug: tenantData.slug,
          address: tenantData.address ?? null,
          logo_url: tenantData.logo_url ?? null,
          updatedAt: new Date(),
        })
        .where(eq(tenant.id, id))
        .returning(); 
        if (result.length === 0) {
          throw new Error(`Tenant not found for id: ${id}`);
        }
        console.log("Tenant updated successfully:", result);
        return result;
      }
      catch (error) {
        console.error("Error updating tenant:", error);
        throw error;
      }
    }

    const deleteTenant = async (id: string) => {
      const dbService = createDatabaseService();
      const db = dbService.getDb();
      try {
        const result = await db
          .delete(tenant)
          .where(eq(tenant.id, id))
          .returning();
        return result;
      }
      catch (error) {
        console.error("Error deleting tenant:", error);
        throw error;
      }
    }

  return {
    createTenant,
    getTenants,
    updateTenant,
    deleteTenant
  }
}