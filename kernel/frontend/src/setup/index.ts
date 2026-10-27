// The wizard component itself is not exported here: SetupGate lazy-loads it as a
// separate bundle, and a static export would pull it into every page.
export {
  getAppConfig,
  getSetupChecks,
  getSetupStatus,
  isSetupRequired,
  runSetup,
  SETUP_TOKEN_HEADER,
  SetupErrorCode,
} from './api';
export { SETUP_PATH, SetupGate, type SetupGateProps } from './SetupGate';
export { SetupLoader, type SetupLoaderProps } from './SetupLoader';
export type { SetupWizardProps } from './SetupWizard';
export { slugify } from './slug';
export type { AppConfig, OrganizationInput, SetupChecks, SetupRequest, SetupResult, SetupStatus, Tenant } from './types';
