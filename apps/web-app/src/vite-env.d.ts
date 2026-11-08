/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Address of the backend engine (apps/api-server), e.g. http://localhost:8001 */
  readonly VITE_API_URL?: string;
  /** Product documentation site, e.g. https://innostes.com/docs. The Help button is hidden when unset. */
  readonly VITE_DOCS_URL?: string;
}
