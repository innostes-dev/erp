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

// 2. Report-mode checks (tracked until prompts 12/17 switch them to enforce)
console.log('\n--- REPORT-MODE GATES (Defect metrics tracking to zero) ---');

const frontmatterErrors = runFrontmatterCheck({ enforce: false });
console.log(`ℹ️ [FRONTMATTER] ${frontmatterErrors.length} incomplete frontmatter entries (enforced in prompt 12)`);

const coverageErrors = runCoverageCheck({ enforce: false });
console.log(`ℹ️ [COVERAGE] ${coverageErrors.length} exported symbols lacking <ApiTable> or allowlist (enforced in prompt 12)`);

const apiTableErrors = runApiTablesCheck({ enforce: false });
console.log(`ℹ️ [API TABLES] ${apiTableErrors.length} <ApiTable> entries with 0 props or missing (enforced in prompt 12)`);

const templateErrors = runTemplateCheck({ enforce: false });
console.log(`ℹ️ [TEMPLATE] ${templateErrors.length} template ordering / heading case defects (enforced in prompt 12)`);

console.log(`ℹ️ [SPELLING] ${spellingErrors.length} American spelling occurrences (enforced in prompt 17)`);

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\nQuality gates finished in ${duration}s.`);

const totalEnforcedFailures =
  linkErrors.length +
  demoErrors.length +
  sidebarErrors.length +
  mdxSafetyErrors.length +
  consistencyErrors.length +
  proseErrors.length;

if (totalEnforcedFailures > 0) {
  console.error(`\n❌ Quality gates failed with ${totalEnforcedFailures} enforced defect(s).`);
  process.exit(1);
} else {
  console.log('\n✅ All enforced quality gates passed successfully.');
}
