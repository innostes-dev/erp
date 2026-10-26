/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Address of the backend engine (apps/api-server), e.g. http://localhost:8001 */
  readonly VITE_API_URL?: string;
}
