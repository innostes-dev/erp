import { runLinkCheck } from './check-links.mjs';
import { runDemoCheck } from './check-demos.mjs';
import { runSidebarCheck } from './check-sidebar.mjs';
import { runMdxSafetyCheck } from './check-mdx-safety.mjs';
import { runConsistencyCheck } from './check-consistency.mjs';
import { runProseCheck } from './check-prose.mjs';
import { runFrontmatterCheck } from './check-frontmatter.mjs';
import { runCoverageCheck } from './check-coverage.mjs';
import { runApiTablesCheck } from './check-api-tables.mjs';
import { runTemplateCheck } from './check-template.mjs';
import { runApiDocsStaleCheck } from './check-api-docs-stale.mjs';
import { runCatalogueCheck } from './check-catalogues.mjs';
import { checkApiSamples } from './check-api-samples.mjs';

console.log('Running documentation quality gates...\n');
const startTime = Date.now();

// 1. Enforced checks
console.log('--- ENFORCED QUALITY GATES ---');

const linkErrors = runLinkCheck();
if (linkErrors.length > 0) {
  console.error(`❌ [LINKS] ${linkErrors.length} broken links or anchors:`);
  for (const e of linkErrors) console.error(`   ${e.file}:${e.line} - ${e.message}`);
} else {
  console.log('✓ [LINKS] All internal links and anchors resolved.');
}

const demoErrors = runDemoCheck();
if (demoErrors.length > 0) {
  console.error(`❌ [DEMOS] ${demoErrors.length} demo issues:`);
  for (const e of demoErrors) console.error(`   ${e.file}:${e.line} - ${e.message}`);
} else {
  console.log('✓ [DEMOS] All demo files exist, are referenced, and use allowed imports.');
}

const sidebarErrors = runSidebarCheck();
if (sidebarErrors.length > 0) {
  console.error(`❌ [SIDEBAR] ${sidebarErrors.length} meta.json issues:`);
  for (const e of sidebarErrors) console.error(`   ${e.file}:${e.line} - ${e.message}`);
} else {
  console.log('✓ [SIDEBAR] All pages listed in meta.json and files exist.');
}

const mdxSafetyErrors = runMdxSafetyCheck();
if (mdxSafetyErrors.length > 0) {
  console.error(`❌ [MDX SAFETY] ${mdxSafetyErrors.length} unescaped JSX/MDX brace issues:`);
  for (const e of mdxSafetyErrors) console.error(`   ${e.file}:${e.line} - ${e.message}`);
} else {
  console.log('✓ [MDX SAFETY] All MDX pages safe from unescaped prose braces.');
}

const consistencyErrors = runConsistencyCheck();
if (consistencyErrors.length > 0) {
  console.error(`❌ [CONSISTENCY] ${consistencyErrors.length} version/count mismatches:`);
  for (const e of consistencyErrors) console.error(`   ${e.file}:${e.line} - ${e.message}`);
} else {
  console.log('✓ [CONSISTENCY] Header version matches packages/ui/package.json.');
}

const { enforcedErrors: proseErrors, spellingErrors } = runProseCheck();
if (proseErrors.length > 0) {
  console.error(`❌ [PROSE] ${proseErrors.length} banned words, tone, or placeholder issues:`);
  for (const e of proseErrors) console.error(`   ${e.file}:${e.line} - ${e.message}`);
} else {
  console.log('✓ [PROSE] Zero banned marketing phrases, emoji, or invalid placeholders.');
}

if (spellingErrors.length > 0) {
  console.error(`❌ [SPELLING] ${spellingErrors.length} American spelling violations:`);
  for (const e of spellingErrors) console.error(`   ${e.file}:${e.line} - ${e.message}`);
} else {
  console.log('✓ [SPELLING] All prose adheres strictly to British English spelling.');
}

const frontmatterErrors = runFrontmatterCheck({ enforce: true });
if (frontmatterErrors.length > 0) {
  console.error(`❌ [FRONTMATTER] ${frontmatterErrors.length} frontmatter issues:`);
  for (const e of frontmatterErrors) console.error(`   ${e.file}:${e.line} - ${e.message}`);
} else {
  console.log('✓ [FRONTMATTER] All component, widget, and chart frontmatters are complete.');
}

const coverageErrors = runCoverageCheck({ enforce: true });
if (coverageErrors.length > 0) {
  console.error(`❌ [COVERAGE] ${coverageErrors.length} undocumented symbols:`);
  for (const e of coverageErrors) console.error(`   ${e.message}`);
} else {
  console.log('✓ [COVERAGE] All exported components are documented in <ApiTable> or allowlisted.');
}

const templateErrors = runTemplateCheck({ enforce: true });
if (templateErrors.length > 0) {
  console.error(`❌ [TEMPLATE] ${templateErrors.length} template ordering or heading defects:`);
  for (const e of templateErrors) console.error(`   ${e.file} - ${e.message}`);
} else {
  console.log('✓ [TEMPLATE] All component pages follow the 7-section template strictly.');
}

const apiDocsStaleErrors = runApiDocsStaleCheck();
if (apiDocsStaleErrors.length > 0) {
  console.error(`❌ [API FRESHNESS] ${apiDocsStaleErrors.length} API docs freshness issues:`);
  for (const e of apiDocsStaleErrors) console.error(`   ${e.file} - ${e.message}`);
} else {
  console.log('✓ [API FRESHNESS] All 33 API operations and 41 schemas are fresh against openapi.json.');
}

const catalogueErrors = runCatalogueCheck();
if (catalogueErrors.length > 0) {
  console.error(`❌ [CATALOGUES] ${catalogueErrors.length} catalogue or changelog issues:`);
  for (const e of catalogueErrors) console.error(`   ${e.file} - ${e.message}`);
} else {
  console.log('✓ [CATALOGUES] All ErrorCode constants and API changelog versions are in sync.');
}

const sampleCheckResult = await checkApiSamples();
const sampleErrors = sampleCheckResult.issues || [];
if (sampleErrors.length > 0) {
  console.error(`❌ [API SAMPLES] ${sampleErrors.length} sample contract issues:`);
  for (const e of sampleErrors) console.error(`   ${e}`);
} else {
  console.log('✓ [API SAMPLES] All code samples valid against openapi.json and standards.');
}

// 2. Report-mode checks
console.log('\n--- REPORT-MODE GATES ---');

const apiTableErrors = runApiTablesCheck({ enforce: false });
console.log(`ℹ️ [API TABLES] ${apiTableErrors.length} <ApiTable> entries with 0 props or missing (tracked)`);

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\nQuality gates finished in ${duration}s.`);

const totalEnforcedFailures =
  linkErrors.length +
  demoErrors.length +
  sidebarErrors.length +
  mdxSafetyErrors.length +
  consistencyErrors.length +
  proseErrors.length +
  spellingErrors.length +
  frontmatterErrors.length +
  coverageErrors.length +
  templateErrors.length +
  apiDocsStaleErrors.length +
  catalogueErrors.length +
  sampleErrors.length;

if (totalEnforcedFailures > 0) {
  console.error(`\n❌ Quality gates failed with ${totalEnforcedFailures} enforced defect(s).`);
  process.exit(1);
} else {
  console.log('\n✅ All enforced quality gates passed successfully.');
}
