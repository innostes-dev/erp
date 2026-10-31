#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..');
const apiServerRoot = join(landingRoot, '..', 'api-server');
const openapiPath = join(apiServerRoot, 'openapi.json');
const targetDocsDir = join(landingRoot, 'content', 'api-docs');
const publicDir = join(landingRoot, 'public');

if (!existsSync(openapiPath)) {
  console.error(`Error: openapi.json not found at ${openapiPath}`);
  process.exit(1);
}

const spec = JSON.parse(readFileSync(openapiPath, 'utf8'));

// Copy openapi.json to public/
mkdirSync(publicDir, { recursive: true });
copyFileSync(openapiPath, join(publicDir, 'openapi.json'));

const toKebab = (str) => {
  const result = str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
  if (result === 'api-logger-get-info') return 'tracura-get-info';
  if (result === 'api-logger-info-response') return 'tracura-info-response';
  return result;
};

const tagSlugs = {
  General: 'general',
  Observability: 'observability',
  Authentication: 'authentication',
  Setup: 'setup',
  Tenancy: 'tenancy',
  'User management': 'user-management',
  CRM: 'crm',
  HRMS: 'hrms',
  'API logger': 'tracura',
  Tracura: 'tracura',
};

const tagOrder = [
  'General',
  'Observability',
  'Authentication',
  'Setup',
  'Tenancy',
  'User management',
  'CRM',
  'HRMS',
  'API logger',
];

const tagDescriptions = {
  General: 'General server status and configuration endpoints.',
  Observability: 'Health check and diagnostic endpoints for orchestration and monitoring.',
  Authentication: 'User authentication, JWT issuance, password recovery, and email verification.',
  Setup: 'First-boot initialisation, environment pre-flight checks, and root tenant creation.',
  Tenancy: 'Multi-tenant organisation management, module lifecycle, and plugin configuration.',
  'User management': 'User account provisioning, role queries, and profile management.',
  CRM: 'Customer Relationship Management module operations.',
  HRMS: 'Human Resource Management System module operations.',
  'API logger': 'Tracura open-source API telemetry, tracing, and request inspection engine.',
  Tracura: 'Tracura open-source API telemetry, tracing, and request inspection engine.',
};

// Ensure content/api-docs/ exists; do not delete guides folder
mkdirSync(targetDocsDir, { recursive: true });

// Helper to resolve $ref
function resolveRef(ref) {
  if (!ref || !ref.startsWith('#/components/schemas/')) return null;
  const name = ref.replace('#/components/schemas/', '');
  return { name, schema: spec.components?.schemas?.[name] };
}

// Generate example mock data for schemas
function generateExample(schema, depth = 0) {
  if (!schema || depth > 3) return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.examples && schema.examples.length > 0) return schema.examples[0];
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref);
    return resolved ? generateExample(resolved.schema, depth + 1) : {};
  }
  if (schema.enum) return schema.enum[0];
  if (schema.type === 'string') {
    if (schema.format === 'date-time') return '2026-10-29T10:00:00Z';
    if (schema.format === 'email') return 'priya.shah@northwind.example';
    return 'string';
  }
  if (schema.type === 'integer') return 1;
  if (schema.type === 'number') return 1.0;
  if (schema.type === 'boolean') return true;
  if (schema.type === 'array') {
    const itemEx = schema.items ? generateExample(schema.items, depth + 1) : 'item';
    return [itemEx];
  }
  if (schema.type === 'object' || schema.properties) {
    const obj = {};
    for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
      obj[propName] = generateExample(propSchema, depth + 1);
    }
    return obj;
  }
  return {};
}

// Format schema type string
function formatType(prop) {
  if (!prop) return 'any';
  if (prop.$ref) {
    const name = prop.$ref.replace('#/components/schemas/', '');
    return `[${name}](/api-reference/schemas/${toKebab(name)})`;
  }
  if (prop.anyOf) {
    return prop.anyOf.map(formatType).join(' \\| ');
  }
  if (prop.type === 'array') {
    const itemType = prop.items ? formatType(prop.items) : 'any';
    return `${itemType}[]`;
  }
  if (prop.enum) {
    return `enum (${prop.enum.map((e) => `\`"${e}"\``).join(', ')})`;
  }
  return prop.type || 'string';
}

// Extract operations grouped by tag
const opsByTag = {};
for (const tag of tagOrder) {
  opsByTag[tag] = [];
}

for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) continue;
    const rawTag = op.tags?.[0] || 'General';
    if (!opsByTag[rawTag]) opsByTag[rawTag] = [];
    opsByTag[rawTag].push({
      method: method.toUpperCase(),
      path,
      op,
    });
  }
}

// 1. Generate Schemas
const schemasDir = join(targetDocsDir, 'schemas');
mkdirSync(schemasDir, { recursive: true });

const schemaList = Object.keys(spec.components?.schemas || {}).sort();
const schemaMetaPages = ['index'];

// Schemas Index
let schemasIndexMdx = `---
title: "Schemas"
description: "Data models and payload schemas across the innostes ERP API."
---

Complete alphabetical catalogue of all ${schemaList.length} data transfer objects, request models, and response envelopes used across the API endpoints.

| Schema | Type | Description |
| --- | --- | --- |
`;

for (const name of schemaList) {
  const schema = spec.components.schemas[name];
  const slug = toKebab(name);
  schemaMetaPages.push(slug);
  const typeStr = schema.type || (schema.enum ? 'enum' : 'object');
  const desc = (schema.description || 'Data schema model.').replace(/\n+/g, ' ');
  schemasIndexMdx += `| [${name}](/api-reference/schemas/${slug}) | \`${typeStr}\` | ${desc} |\n`;

  // Write individual schema page
  let schemaMdx = `---
title: ${JSON.stringify(name)}
description: ${JSON.stringify(desc)}
---

${desc}

`;

  if (schema.enum) {
    schemaMdx += `## Allowed values\n\n`;
    schemaMdx += `| Value | Description |\n| --- | --- |\n`;
    for (const val of schema.enum) {
      schemaMdx += `| \`"${val}"\` | Literal value representation. |\n`;
    }
    schemaMdx += `\n`;
  }

  if (schema.properties) {
    schemaMdx += `## Properties\n\n`;
    schemaMdx += `| Property | Type | Required | Default | Description |\n`;
    schemaMdx += `| --- | --- | --- | --- | --- |\n`;
    const requiredSet = new Set(schema.required || []);
    for (const [propName, propDef] of Object.entries(schema.properties)) {
      const isReq = requiredSet.has(propName) ? 'Yes' : 'No';
      const defVal = propDef.default !== undefined ? `\`${JSON.stringify(propDef.default)}\`` : '—';
      const propDesc = (propDef.description || '—').replace(/\n+/g, ' ');
      schemaMdx += `| \`${propName}\` | ${formatType(propDef)} | ${isReq} | ${defVal} | ${propDesc} |\n`;
    }
    schemaMdx += `\n`;
  }

  const example = generateExample(schema);
  if (example) {
    schemaMdx += `## Example payload\n\n`;
    schemaMdx += `\`\`\`json
${JSON.stringify(example, null, 2)}
\`\`\`\n`;
  }

  writeFileSync(join(schemasDir, `${slug}.mdx`), schemaMdx.trim() + '\n');
}

writeFileSync(join(schemasDir, 'index.mdx'), schemasIndexMdx.trim() + '\n');
writeFileSync(
  join(schemasDir, 'meta.json'),
  JSON.stringify({ title: 'Schemas', pages: schemaMetaPages }, null, 2) + '\n'
);

// 2. Generate Operation Pages
const tagMetaList = [];

for (const tag of tagOrder) {
  const ops = opsByTag[tag] || [];
  if (ops.length === 0) continue;

  const tagSlug = tagSlugs[tag] || toKebab(tag);
  tagMetaList.push(`...${tagSlug}`);
  const tagDir = join(targetDocsDir, tagSlug);
  mkdirSync(tagDir, { recursive: true });

  const opPages = [];

  for (const { method, path, op } of ops) {
    const opId = op.operationId;
    const opSlug = toKebab(opId);
    opPages.push(opSlug);

    const summary = op.summary || `${method} ${path}`;
    const desc = (op.description || '').trim();

    // Determine auth type
    let authType = 'None';
    if (op.security && op.security.length > 0) {
      if (op.security.some((s) => 'BearerAuth' in s)) {
        authType = 'BearerAuth';
      } else if (op.security.some((s) => 'SetupToken' in s)) {
        authType = 'SetupToken';
      }
    }

    let mdx = `---
title: ${JSON.stringify(summary)}
description: ${JSON.stringify(desc ? desc.split('.')[0] + '.' : summary)}
---

<ApiEndpoint method="${method}" path="${path}" auth="${authType}" />

${desc}

`;

    // Auth explanation
    mdx += `## Authentication\n\n`;
    if (authType === 'BearerAuth') {
      mdx += `Requires a valid JSON Web Token (JWT) issued by \`/auth/login\`. Pass the token in the \`Authorization\` HTTP header using the \`Bearer\` scheme:\n\n`;
      mdx += `\`\`\`http
Authorization: Bearer <your-access-token>
\`\`\`\n\n`;
    } else if (authType === 'SetupToken') {
      mdx += `Requires a privileged first-run setup token displayed in the server console upon boot. Pass the token in the \`X-Setup-Token\` HTTP header:\n\n`;
      mdx += `\`\`\`http
X-Setup-Token: <setup-token>
\`\`\`\n\n`;
    } else {
      mdx += `This endpoint is public and does not require an authentication header.\n\n`;
    }

    // Parameters
    const params = op.parameters || [];
    const pathParams = params.filter((p) => p.in === 'path');
    const queryParams = params.filter((p) => p.in === 'query');
    const headerParams = params.filter((p) => p.in === 'header');

    if (params.length > 0) {
      mdx += `## Parameters\n\n`;
      if (pathParams.length > 0) {
        mdx += `### Path parameters\n\n`;
        mdx += `| Parameter | Type | Required | Description |\n`;
        mdx += `| --- | --- | --- | --- |\n`;
        for (const p of pathParams) {
          const pDesc = (p.description || '—').replace(/\n+/g, ' ');
          mdx += `| \`${p.name}\` | ${formatType(p.schema)} | ${p.required ? 'Yes' : 'No'} | ${pDesc} |\n`;
        }
        mdx += `\n`;
      }
      if (queryParams.length > 0) {
        mdx += `### Query parameters\n\n`;
        mdx += `| Parameter | Type | Required | Default | Description |\n`;
        mdx += `| --- | --- | --- | --- | --- |\n`;
        for (const p of queryParams) {
          const pDesc = (p.description || '—').replace(/\n+/g, ' ');
          const defVal =
            p.schema?.default !== undefined ? `\`${JSON.stringify(p.schema.default)}\`` : '—';
          mdx += `| \`${p.name}\` | ${formatType(p.schema)} | ${p.required ? 'Yes' : 'No'} | ${defVal} | ${pDesc} |\n`;
        }
        mdx += `\n`;
      }
      if (headerParams.length > 0) {
        mdx += `### Header parameters\n\n`;
        mdx += `| Header | Type | Required | Description |\n`;
        mdx += `| --- | --- | --- | --- |\n`;
        for (const p of headerParams) {
          const pDesc = (p.description || '—').replace(/\n+/g, ' ');
          mdx += `| \`${p.name}\` | ${formatType(p.schema)} | ${p.required ? 'Yes' : 'No'} | ${pDesc} |\n`;
        }
        mdx += `\n`;
      }
    }

    // Request body
    let requestBodyExampleJson = '';
    let hasBody = false;
    if (op.requestBody) {
      hasBody = true;
      const content = op.requestBody.content?.['application/json'];
      if (content && content.schema) {
        const schema = content.schema;
        mdx += `## Request body\n\n`;
        if (schema.$ref) {
          const refName = schema.$ref.replace('#/components/schemas/', '');
          mdx += `Payload model: [${refName}](/api-reference/schemas/${toKebab(refName)})\n\n`;
        }

        const resolved = schema.$ref ? resolveRef(schema.$ref)?.schema : schema;
        if (resolved?.properties) {
          mdx += `| Field | Type | Required | Description |\n`;
          mdx += `| --- | --- | --- | --- |\n`;
          const reqSet = new Set(resolved.required || []);
          for (const [propName, propDef] of Object.entries(resolved.properties)) {
            const isReq = reqSet.has(propName) ? 'Yes' : 'No';
            const propDesc = (propDef.description || '—').replace(/\n+/g, ' ');
            mdx += `| \`${propName}\` | ${formatType(propDef)} | ${isReq} | ${propDesc} |\n`;
          }
          mdx += `\n`;
        }

        const ex = content.example || (content.examples && Object.values(content.examples)[0]?.value) || generateExample(schema);
        if (ex) {
          requestBodyExampleJson = JSON.stringify(ex, null, 2);
          mdx += `### Request example\n\n\`\`\`json
${requestBodyExampleJson}
\`\`\`\n\n`;
        }
      }
    }

    // Responses
    if (op.responses) {
      mdx += `## Responses\n\n`;
      for (const [status, resp] of Object.entries(op.responses)) {
        mdx += `### HTTP ${status}\n\n`;
        mdx += `${resp.description || 'Response'}\n\n`;
        const content = resp.content?.['application/json'];
        if (content && content.schema) {
          if (content.schema.$ref) {
            const refName = content.schema.$ref.replace('#/components/schemas/', '');
            mdx += `Response model: [${refName}](/api-reference/schemas/${toKebab(refName)})\n\n`;
          }
          const ex =
            content.example ||
            (content.examples && Object.values(content.examples)[0]?.value) ||
            generateExample(content.schema);
          if (ex) {
            mdx += `\`\`\`json
${JSON.stringify(ex, null, 2)}
\`\`\`\n\n`;
          }
        }
      }
    }

    // Code Samples in curl, typescript, python
    mdx += `## Code samples\n\n`;
    mdx += `<Tabs items={["cURL", "TypeScript (fetch)", "Python (httpx)"]}>\n`;

    // cURL
    mdx += `  <Tab value="cURL">\n\n`;
    mdx += `\`\`\`bash
curl -X ${method} "http://localhost:8001${path}"`;
    if (authType === 'BearerAuth') {
      mdx += ` \\\n  -H "Authorization: Bearer <your-access-token>"`;
    } else if (authType === 'SetupToken') {
      mdx += ` \\\n  -H "X-Setup-Token: <setup-token>"`;
    }
    if (hasBody && requestBodyExampleJson) {
      mdx += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBodyExampleJson.replace(/\n/g, '\n  ')}'`;
    }
    mdx += `\n\`\`\`\n\n  </Tab>\n`;

    // TypeScript (fetch)
    mdx += `  <Tab value="TypeScript (fetch)">\n\n`;
    mdx += `\`\`\`ts
const response = await fetch('http://localhost:8001${path}', {
  method: '${method}',
  headers: {`;
    if (authType === 'BearerAuth') {
      mdx += `\n    Authorization: 'Bearer <your-access-token>',`;
    } else if (authType === 'SetupToken') {
      mdx += `\n    'X-Setup-Token': '<setup-token>',`;
    }
    if (hasBody && requestBodyExampleJson) {
      mdx += `\n    'Content-Type': 'application/json',`;
    }
    mdx += `\n  },`;
    if (hasBody && requestBodyExampleJson) {
      mdx += `\n  body: JSON.stringify(${requestBodyExampleJson.replace(/\n/g, '\n  ')}),`;
    }
    mdx += `\n});

const data = await response.json();
console.log(data);
\`\`\`\n\n  </Tab>\n`;

    // Python (httpx)
    mdx += `  <Tab value="Python (httpx)">\n\n`;
    mdx += `\`\`\`python
import httpx

headers = {`;
    if (authType === 'BearerAuth') {
      mdx += `\n    "Authorization": "Bearer <your-access-token>",`;
    } else if (authType === 'SetupToken') {
      mdx += `\n    "X-Setup-Token": "<setup-token>",`;
    }
    if (hasBody && requestBodyExampleJson) {
      mdx += `\n    "Content-Type": "application/json",`;
    }
    mdx += `\n}

response = httpx.${method.toLowerCase()}(
    "http://localhost:8001${path}",
    headers=headers,`;
    if (hasBody && requestBodyExampleJson) {
      mdx += `\n    json=${requestBodyExampleJson.replace(/\n/g, '\n    ')},`;
    }
    mdx += `\n)

data = response.json()
print(data)
\`\`\`\n\n  </Tab>\n</Tabs>\n\n`;

    // Try It playground
    mdx += `## Try it\n\n`;
    mdx += `<ApiPlayground method="${method}" path="${path}" authType="${authType}" hasBody={${hasBody}} initialBody={${JSON.stringify(requestBodyExampleJson)}} />\n`;

    writeFileSync(join(tagDir, `${opSlug}.mdx`), mdx.trim() + '\n');
  }

  writeFileSync(
    join(tagDir, 'meta.json'),
    JSON.stringify({ title: tag, pages: opPages }, null, 2) + '\n'
  );
}

// 3. Generate Guides stubs for link integrity and Prompt 06
const guidesDir = join(targetDocsDir, 'guides');
mkdirSync(guidesDir, { recursive: true });

const guides = [
  {
    slug: 'quickstart',
    title: 'Quickstart',
    description: 'Get up and running with the innostes ERP API from scratch in under 10 minutes.',
  },
  {
    slug: 'authentication',
    title: 'Authentication',
    description: 'JWT token issuance, rotation, revocation, and password recovery lifecycle.',
  },
  {
    slug: 'tenancy',
    title: 'Tenancy and Headers',
    description: 'Multi-tenant scoping, organisation boundaries, and the X-Tenant-ID header convention.',
  },
  {
    slug: 'first-run-setup',
    title: 'First-Run Setup',
    description: 'Initialising new deployments, bootstrap tokens, and pre-flight environment checks.',
  },
  {
    slug: 'error-handling',
    title: 'Error Handling',
    description: 'Standard problem detail envelopes, error codes, and robust caller retry strategies.',
  },
  {
    slug: 'pagination',
    title: 'Pagination and Filtering',
    description: 'Traversing record collections with skip, limit, and total count metadata.',
  },
  {
    slug: 'audit-and-soft-delete',
    title: 'Records, Audit, and Soft Delete',
    description: 'Deterministic identifiers, UTC ISO 8601 timestamps, and soft deletion recovery.',
  },
  {
    slug: 'client-generation',
    title: 'Generating Typed Clients',
    description: 'Generating type-safe TypeScript and Python API clients from the published OpenAPI schema.',
  },
  {
    slug: 'environments-and-cors',
    title: 'Environments and CORS',
    description: 'Base URLs, CORS_ORIGINS settings, load balancer health checks, and runtime configuration.',
  },
];

for (const g of guides) {
  const guideFilePath = join(guidesDir, `${g.slug}.mdx`);
  if (!existsSync(guideFilePath)) {
    const guideMdx = `---
title: ${JSON.stringify(g.title)}
description: ${JSON.stringify(g.description)}
---

${g.description}

## Overview

This guide covers operational conventions and best practices for interacting with the innostes ERP API platform.

### Conventions summary

- **Environment base URL**: \`http://localhost:8001\` for local development; \`https://api.innostes.com\` for production environments.
- **Payload format**: Standard JSON (\`application/json\`) with UTF-8 encoding across all endpoints.
- **Example universe**: Northwind Traders Pvt Ltd (\`priya.shah@northwind.example\`, Bengaluru distributor, INR currency).

Refer to the [API Overview](/api-reference) for the complete endpoint catalogue.
`;
    writeFileSync(guideFilePath, guideMdx.trim() + '\n');
  }
}

writeFileSync(
  join(guidesDir, 'meta.json'),
  JSON.stringify(
    {
      title: 'Guides',
      pages: guides.map((g) => g.slug),
    },
    null,
    2
  ) + '\n'
);

// 4. Generate Overview Page
const overviewMdx = `---
title: "API Reference Overview"
description: "REST API reference, OpenAPI specifications, and integration guides for the innostes ERP platform."
---

Welcome to the innostes ERP REST API documentation. The API provides a modern, high-performance interface for multi-tenant enterprise resource planning, identity and access management, and modular ERP extensions.

## Base URLs

The API server listens on the following environments:

| Environment | Base URL | Usage |
| --- | --- | --- |
| Local Development | \`http://localhost:8001\` | Local Docker and Python virtual environments |
| Production | \`https://api.innostes.com\` | Cloud staging and multi-tenant production clusters |

## Authentication

The API uses stateless JSON Web Tokens (JWT) passed in the standard \`Authorization: Bearer <token>\` header for all protected operations. During initial system bootstrap, single-use \`X-Setup-Token\` headers authenticate administrative installation before tenant administrators are provisioned.

## API Conventions

All endpoints adhere to predictable enterprise REST conventions:

- **Quickstart**: Bootstrapping, authentication and first API calls in under 10 minutes. See [Quickstart Guide](/api-reference/guides/quickstart).
- **Authentication**: JWT token issuance, refresh rotation, and session logout. See [Authentication Guide](/api-reference/guides/authentication).
- **Identities**: 64-bit integer IDs (\`BigInt\`), returned as numeric values in JSON payloads. See [Tenancy Guide](/api-reference/guides/tenancy).
- **First-run setup**: Bootstrap tokens, pre-flight environment checks, and initialisation. See [First-Run Setup Guide](/api-reference/guides/first-run-setup).
- **Timestamps**: UTC ISO 8601 formatted timestamps (e.g. \`2026-10-29T10:00:00Z\`). See [Records and Audit Guide](/api-reference/guides/audit-and-soft-delete).
- **Pagination**: Offset-based pagination with \`skip\` and \`limit\` query parameters, returning a standardized pagination envelope. See [Pagination Guide](/api-reference/guides/pagination).
- **Soft delete**: Audit records remain recoverable; deleted entries are omitted by default unless \`include_deleted=true\` is requested. See [Records and Audit Guide](/api-reference/guides/audit-and-soft-delete).
- **Error handling**: Machine-readable RFC 7807 problem details with typed \`code\` identifiers and contextual parameter metadata. See [Error Handling Guide](/api-reference/guides/error-handling).
- **Client generation**: Generating typed TypeScript and Python clients from the OpenAPI spec. See [Client Generation Guide](/api-reference/guides/client-generation).
- **Environments and CORS**: Cross-origin settings, load balancer health probes, and runtime configuration. See [Environments and CORS Guide](/api-reference/guides/environments-and-cors).

## OpenAPI specification

The machine-readable OpenAPI 3.1 specification is available for automated code generation, linting, and SDK compilation:

- [Download openapi.json](/api-reference/openapi.json)

## Operation catalogue

Explore endpoints organized by functional subsystem:

| Subsystem | Description | Operations |
| --- | --- | --- |
| [General](/api-reference/general/root) | Core service status and active runtime configuration. | 2 endpoints |
| [Observability](/api-reference/observability/health-check) | Health check and readiness probes for orchestration and monitoring. | 1 endpoint |
| [Authentication](/api-reference/authentication/login) | Identity issuance, session refresh, token revocation, and password recovery. | 10 endpoints |
| [Setup](/api-reference/setup/setup-status) | First-boot deployment initialisation and pre-installation diagnostic checks. | 3 endpoints |
| [Tenancy](/api-reference/tenancy/list-tenants) | Multi-tenant organisation boundaries, module lifecycles, and plugin management. | 12 endpoints |
| [User Management](/api-reference/user-management/create-user) | Account provisioning, role assignments, and authenticated caller profile. | 2 endpoints |
| [CRM](/api-reference/crm/crm-info) | Customer Relationship Management subsystem info and records. | 1 endpoint |
| [HRMS](/api-reference/hrms/hrms-info) | Human Resource Management System employee and organizational directory. | 1 endpoint |
| [Tracura](/api-reference/tracura/tracura-get-info) | Open-source API telemetry, tracing, and request inspection engine. | 1 endpoint |
| [Data Models](/api-reference/schemas) | Complete catalogue of all 41 request and response schemas. | 41 schemas |
| [Error Codes](/api-reference/policies/error-codes) | Complete catalogue of machine-readable error codes and HTTP statuses. | Reference |
| [Policies](/api-reference/policies/versioning) | Versioning, deprecation, limits, security, and changelog policies. | Policies |
`;

writeFileSync(join(targetDocsDir, 'index.mdx'), overviewMdx.trim() + '\n');

// 5. Generate Root meta.json
const rootMeta = {
  title: 'API Reference',
  pages: [
    'index',
    '---Guides---',
    '...guides',
    '---Operations---',
    ...tagMetaList,
    '---Data Models---',
    '...schemas',
    '---Policies & Reference---',
    '...policies',
  ],
};

writeFileSync(join(targetDocsDir, 'meta.json'), JSON.stringify(rootMeta, null, 2) + '\n');

console.log(
  `API Reference generated successfully: ${Object.values(opsByTag).flat().length} operations, ${schemaList.length} schemas in ${targetDocsDir}`
);
