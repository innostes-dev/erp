import { auditlogRepository } from "../repositories";

export function auditlogServices() {
  const createAuditLog = async (auditlogData: any) => {
    const result = await auditlogRepository().createAuditLog(auditlogData);
    console.log("auditlog created successfully:", result);
    return result;
  };

  const getAuditLog = async (id : string) => {
    const result = await auditlogRepository().getAuditLog(id);
    console.log("Audit log fetched successfully:", result);
    return result;
    }; 

  return {
    createAuditLog,
    getAuditLog
  };
}