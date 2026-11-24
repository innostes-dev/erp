// Regenerates src/migrations/0001-kernel-schema.ts from docs/backend-parity/schema.sql.
const fs = require('node:fs');
const path = require('node:path');
const sql = fs.readFileSync(path.join(__dirname, '../../../docs/backend-parity/schema.sql'), 'utf8');
if (/[`\\]|\$\{/.test(sql)) throw new Error('schema.sql contains characters that are unsafe in a template literal');
fs.writeFileSync(
  path.join(__dirname, '../src/migrations/0001-kernel-schema.ts'),
  `// GENERATED from docs/backend-parity/schema.sql (the reference Alembic schema). Do not edit by hand.\n// Regenerate: node scripts/gen-schema.js\nexport const KERNEL_SCHEMA_SQL = \`${sql}\`;\n`,
);
console.log('written');

// 0003: identities + credentials, a verbatim copy of the shared FastAPI file (kernel/backend/migrations/sql/).
const idSql = fs.readFileSync(path.join(__dirname, '../../backend/migrations/sql/0010_identities_credentials.sql'), 'utf8');
if (/[`\\]|\$\{/.test(idSql)) throw new Error('0010_identities_credentials.sql contains characters that are unsafe in a template literal');
fs.writeFileSync(
  path.join(__dirname, '../src/migrations/0003-identities-credentials.ts'),
  `// GENERATED from kernel/backend/migrations/sql/0010_identities_credentials.sql (shared by all backends). Do not edit by hand.\n// Regenerate: node scripts/gen-schema.js\nexport const IDENTITIES_CREDENTIALS_SQL = \`${idSql}\`;\n`,
);
console.log('written 0003');
