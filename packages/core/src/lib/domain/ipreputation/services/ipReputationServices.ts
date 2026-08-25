import { ipReputationRepositories } from "../repositories";

export function ipReputationServices() {
  const createIpReputation = async (ipReputationData: any) => {
    const result = await ipReputationRepositories().createIpReputation(ipReputationData);
    console.log("IpReputation created successfully:", result);
    return result;
  };

  return {
    createIpReputation,
  };
}