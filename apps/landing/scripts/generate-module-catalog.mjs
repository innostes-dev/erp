import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingLib = join(__dirname, '..', 'lib');
const catalogFile = join(landingLib, 'module-catalog.json');

export function getExpectedCatalog() {
  return [
    {
      name: 'kernel.setup',
      type: 'kernel',
      package: 'kernel',
      frontendPackage: '@innostes/kernel',
      entryPoint: 'kernel.setup:module',
      description: 'First-run platform installation, setup token verification, and health gating',
      routes: ['/setup/status', '/setup/checks', '/setup'],
      tables: ['installation'],
      migrationsPath: 'kernel/backend/migrations',
      tags: ['Setup'],
    },
    {
      name: 'kernel.tenancy',
      type: 'kernel',
      package: 'kernel',
      frontendPackage: '@innostes/kernel',
      entryPoint: 'kernel.tenancy:module',
      description: 'Multi-tenant organization provisioning, tenant settings, and module activations',
      routes: ['/tenants', '/tenants/{id}', '/tenants/current/modules', '/tenants/current/plugins'],
      tables: ['tenants', 'tenant_settings', 'tenant_members', 'tenant_modules', 'tenant_plugins'],
      migrationsPath: 'kernel/backend/migrations',
      tags: ['Tenancy'],
    },
    {
      name: 'kernel.user',
      type: 'kernel',
      package: 'kernel',
      frontendPackage: '@innostes/kernel',
      entryPoint: 'kernel.user:module',
      description: 'User accounts, profile management, and Role-Based Access Control (RBAC)',
      routes: ['/users', '/users/{id}', '/roles', '/permissions'],
      tables: ['users', 'user_profiles', 'user_identities', 'roles', 'permissions', 'role_permissions', 'user_roles'],
      migrationsPath: 'kernel/backend/migrations',
      tags: ['Users', 'IAM'],
    },
    {
      name: 'kernel.auth',
      type: 'kernel',
      package: 'kernel',
      frontendPackage: '@innostes/kernel',
      entryPoint: 'kernel.auth:module',
      description: 'JWT authentication, refresh token family rotation, sessions, devices, and API keys',
      routes: ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/change-password', '/auth/reset-password/request', '/auth/reset-password/confirm', '/auth/api-keys', '/auth/sessions'],
      tables: ['user_devices', 'user_sessions', 'user_security', 'password_histories', 'api_keys'],
      migrationsPath: 'kernel/backend/migrations',
      tags: ['Authentication', 'API Keys'],
    },
    {
      name: 'kernel.audit',
      type: 'kernel',
      package: 'kernel',
      frontendPackage: '@innostes/kernel',
      entryPoint: 'kernel.audit:module',
      description: 'Immutable compliance audit trail, field-level before/after diffs, and regulatory reporting',
      routes: ['/audit/logs', '/audit/summary', '/audit/entities/{type}/{id}'],
      tables: ['audit_logs'],
      migrationsPath: 'kernel/backend/migrations',
      tags: ['Audit', 'Compliance'],
    },
    {
      name: 'hrms',
      type: 'business-module',
      package: 'innostes-hrms',
      frontendPackage: '@innostes/hrms',
      entryPoint: 'hrms:module',
      description: 'Human Resource Management: employee directory, department hierarchy, and leave requests',
      routes: ['/hrms/employees', '/hrms/departments', '/hrms/leaves'],
      tables: [],
      migrationsPath: 'modules/hrms/backend/migrations',
      tags: ['HRMS', 'Employees'],
    },
    {
      name: 'crm',
      type: 'business-module',
      package: 'innostes-crm',
      frontendPackage: '@innostes/crm',
      entryPoint: 'crm:module',
      description: 'Customer Relationship Management: lead pipelines, opportunities, and contact directory',
      routes: ['/crm/leads', '/crm/deals', '/crm/contacts'],
      tables: [],
      migrationsPath: 'modules/crm/backend/migrations',
      tags: ['CRM', 'Pipeline'],
    },
    {
      name: 'api_logger',
      type: 'plugin',
      package: 'innostes-api-logger',
      frontendPackage: '@innostes/api-logger',
      entryPoint: 'api_logger:module',
      description: 'Extensible HTTP request/response observability, telemetry, and audit middleware',
      routes: ['/api-logger/logs', '/api-logger/stats'],
      tables: [],
      migrationsPath: 'plugins/api-logger/backend/migrations',
      tags: ['Telemetry', 'Audit'],
    },
  ];
}

export function generateModuleCatalog() {
  const modules = getExpectedCatalog();
  writeFileSync(catalogFile, JSON.stringify(modules, null, 2) + '\n', 'utf8');
  console.log(`Generated module catalog data with ${modules.length} modules -> ${catalogFile}`);
  return modules;
}

export function checkModuleCatalogStaleness() {
  if (!existsSync(catalogFile)) {
    return { passed: false, error: 'module-catalog.json does not exist. Run scripts/generate-module-catalog.mjs' };
  }
  const onDisk = readFileSync(catalogFile, 'utf8').trim();
  const expected = JSON.stringify(getExpectedCatalog(), null, 2).trim();
  if (onDisk !== expected) {
    return { passed: false, error: 'module-catalog.json is stale. Run node apps/landing/scripts/generate-module-catalog.mjs to refresh.' };
  }
  return { passed: true, count: getExpectedCatalog().length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const res = checkModuleCatalogStaleness();
    if (!res.passed) {
      console.error(res.error);
      process.exit(1);
    }
    console.log(`✓ module-catalog.json is fresh (${res.count} modules verified).`);
    process.exit(0);
  }
  generateModuleCatalog();
}
