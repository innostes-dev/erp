import { devicesRepositories } from "../repositories";

export function devicesServices() {
  const createDevice = async (deviceData: any) => {
    const result = await devicesRepositories().createDevice(deviceData);
    console.log("Device created successfully:", result);
    return result;
  };

  const getDevices = async () => {
    const result = await devicesRepositories().getDevices();
    console.log("Devices fetched successfully:", result);
    return result;
  };

  return {
    createDevice,
    getDevices,
  };
}
