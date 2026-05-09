import { HrmsPublicService } from '@innostes/modules/hrms/api-logic';
import { hrmsManifest } from '@innostes/modules/hrms/feature-ui';

// @module-imports

export const MODULE_MANIFESTS = {
  [hrmsManifest.id]: hrmsManifest,
  // @module-manifests
} as const;

export const MODULE_SERVICES = [
  HrmsPublicService,
  // @module-services
] as const;

export const BRIDGE_HANDLER_INJECTS = [
  HrmsPublicService,
  // @module-bridge-injects
] as const;

export const buildBridgeHandlers = (hrmsService: HrmsPublicService) => [
  {
    moduleId: 'hr',
    isLoaded: true,
    api: {
      getEmployeeInfo: (tenantId: string, id: string) => hrmsService.getEmployeeInfo(tenantId, id),
    },
  },
  // @module-bridge-handlers
];
