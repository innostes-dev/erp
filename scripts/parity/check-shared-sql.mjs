// Fails when a backend's copy of a shared migration differs from the FastAPI reference file.
// Usage: node scripts/parity/check-shared-sql.mjs   (no dependencies)
// Fix:   cp kernel/backend/migrations/sql/0010_identities_credentials.sql kernel/backend-laravel/database/schema/
//        node kernel/backend-nestjs/scripts/gen-schema.js
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const reference = read('kernel/backend/migrations/sql/0010_identities_credentials.sql');
const ts = read('kernel/backend-nestjs/src/migrations/0003-identities-credentials.ts').match(/= `([\s\S]*)`;\n$/);
const copies = {
  'kernel/backend-laravel/database/schema/0010_identities_credentials.sql': read('kernel/backend-laravel/database/schema/0010_identities_credentials.sql'),
  'kernel/backend-nestjs/src/migrations/0003-identities-credentials.ts': ts ? ts[1] : null,
};
let failed = false;
for (const [path, text] of Object.entries(copies)) {
  if (text === reference) console.log(`ok   ${path}`);
  else { console.error(`DIFF ${path} differs from kernel/backend/migrations/sql/0010_identities_credentials.sql`); failed = true; }
}
process.exit(failed ? 1 : 0);
