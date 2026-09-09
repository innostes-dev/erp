import { createDatabaseService } from "../../../database";
import { devices } from "../../../database/schemas";

export function devicesRepositories() {
  const createDevice = async (deviceData: any) => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db
        .insert(devices)
        .values({
          user_id: deviceData.user_id,
          device_name: deviceData.device_name ?? null,
          device_fingerprint_hash: deviceData.device_fingerprint_hash ?? null,
          platform: deviceData.platform ?? null,
          browser: deviceData.browser ?? null,
          ip_address: deviceData.ip_address ?? null,
          first_seen_at: new Date(deviceData.first_seen_at),
          last_seen_at: new Date(deviceData.last_seen_at),
          trusted: deviceData.trusted ?? false,
          revoked_at: deviceData.revoked_at ? new Date(deviceData.revoked_at) : null,
        })
        .returning();

      console.log("Device created successfully:", result);
      return result;
    } catch (error) {
      console.error("Error creating device:", error);
      throw error;
    }
  };

  const getDevices = async () => {
    const dbService = createDatabaseService();
    const db = dbService.getDb();
    try {
      const result = await db.select().from(devices);
      console.log("Devices fetched successfully:", result);
      return result;
    } catch (error) {
      console.error("Error fetching devices:", error);
      throw error;
    }
  };

  return {
    createDevice,
    getDevices,
  };
}
