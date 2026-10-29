import { fileURLToPath } from 'node:url';
import { runDiagramCheck } from './check-diagrams.mjs';
import { runArchFrontmatterCheck } from './check-arch-frontmatter.mjs';
import { runAdrCheck } from './check-adrs.mjs';
import { runArc42CoverageCheck } from './check-arc42-coverage.mjs';
import { runLinkCheck } from './check-links.mjs';
import { checkModuleCatalogStaleness } from '../generate-module-catalog.mjs';

async function main() {
  console.log('====================================================');
  console.log('Running Innostes ERP Architecture Documentation Gates');
  console.log('====================================================\n');

  let failed = false;

  // Gate 1: Mermaid Diagram Validation
  console.log('1. Checking Mermaid diagrams in content/dev-docs...');
  const diagramResult = await runDiagramCheck();
  console.log(`   Checked ${diagramResult.diagramCount} diagrams.`);
  if (!diagramResult.passed) {
    failed = true;
    for (const err of diagramResult.errors) {
      console.error(`   ✗ [DIAGRAM] ${err.file}:${err.line} - ${err.message}`);
    }
  } else {
    console.log('   ✓ Diagrams valid.');
  }

  // Gate 2: Architecture & Operations Frontmatter (owner, lastReviewed)
  console.log('\n2. Checking architecture/operations frontmatter (A1)...');
  const fmResult = runArchFrontmatterCheck({ enforce: false });
  console.log(`   Checked ${fmResult.checkedFiles} files.`);
  for (const w of fmResult.warnings) {
    console.warn(`   ⚠ [WARN] ${w.file}: ${w.message}`);
  }
  if (!fmResult.passed) {
    failed = true;
    for (const err of fmResult.errors) {
      console.error(`   ✗ [FRONTMATTER] ${err.file}:${err.line} - ${err.message}`);
    }
  } else {
    console.log('   ✓ Frontmatter schema valid.');
  }

  // Gate 3: MADR Architecture Decision Records (ADRs)
  console.log('\n3. Checking MADR Decision Records (R1-R9)...');
  const adrResult = runAdrCheck();
  console.log(`   Checked ${adrResult.checkedCount} ADRs.`);
  for (const w of adrResult.warnings) {
    console.warn(`   ⚠ [WARN] ${w.message}`);
  }
  if (!adrResult.passed) {
    failed = true;
    for (const err of adrResult.errors) {
      console.error(`   ✗ [ADR] ${err.file}:${err.line} - ${err.message}`);
    }
  } else {
    console.log('   ✓ ADR checks passed.');
  }

  // Gate 4: arc42 Coverage Map (Report mode)
  console.log('\n4. Checking arc42 12-section coverage...');
  const arc42Result = runArc42CoverageCheck({ enforceAll: false });
  console.log(`   Covered ${arc42Result.coveredCount}/12 arc42 sections.`);
  for (const w of arc42Result.warnings) {
    console.log(`   ℹ ${w.message}`);
  }

  // Gate 5: Cross-Doc Link Integrity
  console.log('\n5. Checking internal links across documentation...');
  const linkResult = runLinkCheck();
  if (linkResult && linkResult.errors && linkResult.errors.length > 0) {
    failed = true;
    for (const err of linkResult.errors) {
      console.error(`   ✗ [LINK] ${err.file}:${err.line} - ${err.message}`);
    }
  } else {
    console.log('   ✓ Documentation internal links resolve.');
  }

  // Gate 6: Module Catalogue Staleness Check
  console.log('\n6. Checking module catalogue data freshness...');
  const catalogResult = checkModuleCatalogStaleness();
  if (!catalogResult.passed) {
    failed = true;
    console.error(`   ✗ [CATALOG] ${catalogResult.error}`);
  } else {
    console.log(`   ✓ Module catalogue is fresh (${catalogResult.count} modules verified).`);
  }

  console.log('\n====================================================');
  if (failed) {
    console.error('Architecture documentation gates FAILED.');
    process.exit(1);
  } else {
    console.log('All architecture documentation gates PASSED.');
    process.exit(0);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Fatal gate error:', err);
    process.exit(1);
  });
}
