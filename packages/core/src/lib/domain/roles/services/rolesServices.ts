import { rolesRepositories } from "../repositories";

export function rolesServices() {
  const createRole = async (roleData: any) => {
    const result = await rolesRepositories().createRole(roleData);
    console.log("Role created successfully:", result);
    return result;
  };

  const getRoles = async () => {
    const result = await rolesRepositories().getRoles();
    console.log("Roles fetched successfully:", result);
    return result;
    };

    const updateRole = async (id : string,roleData: any) => {
        const result = await rolesRepositories().updateRole(id,roleData);
        console.log("Role updated successfully:", result);
        return result;
    }

    const deleteRole = async (id: string) => {
        const result = await rolesRepositories().deleteRole(id);
        console.log("Role deleted successfully:", result);
        return result;
    }   

  return {
    createRole,
    getRoles,
    updateRole,
    deleteRole
  };
}