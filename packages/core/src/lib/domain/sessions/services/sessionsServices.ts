import { sessionsRepositories } from "../repositories";

export function sessionsServices() {
  const createSession = async (sessionData: any) => {
    const result = await sessionsRepositories().createSession(sessionData);
    console.log("Session created successfully:", result);
    return result;
  };

  return {
    createSession,
  };
}
