import { tenantRepositories } from "../repositories/";

export function tenantServices() {
  const createTenant = async (tenantData: any) => {
    const result = await tenantRepositories().createTenant(tenantData);
    console.log("Tenant created successfully:", result);
    return result;
  };

  const getTenants = async () => {
    const result = await tenantRepositories().getTenants();
    console.log("Tenants fetched successfully:", result);
    return result;
    };

    const updateTenant = async (id : string,tenantData: any) => {
        const result = await tenantRepositories().updateTenant(id,tenantData);
        console.log("Tenant updated successfully:", result);
        return result;
    }

    const deleteTenant = async (id: string) => {
        const result = await tenantRepositories().deleteTenant(id);
        console.log("Tenant deleted successfully:", result);
        return result;
    }   

  return {
    createTenant,
    getTenants,
    updateTenant,
    deleteTenant
  };
}