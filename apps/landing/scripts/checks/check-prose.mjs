import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const docsRoot = join(landingRoot, 'content', 'docs');

function getMdxFiles(dir) {
  let results = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) {
      results = results.concat(getMdxFiles(full));
    } else if (full.endsWith('.mdx')) {
      results.push(full);
    }
  }
  return results;
}

const BANNED_WORDS = [
  'seamlessly',
  'seamless',
  'robust',
  'powerful',
  'effortlessly',
  'effortless',
  'leverage',
  'elevate',
  'unlock',
  'supercharge',
  'delve',
  'dive into',
  'comprehensive',
  'cutting-edge',
  'state-of-the-art',
  'blazingly fast',
  'best-in-class',
  'world-class',
  'game-changer',
  'out of the box',
  'under the hood',
  'it\'s worth noting',
  'in this guide we will',
  'happy coding',
  'flagship',
];

const PLACEHOLDERS = [
  'john doe',
  'jane doe',
  'user 1',
  'foo',
  'foobar',
  'lorem ipsum',
];

const AMERICAN_SPELLINGS = [
  { us: 'color', uk: 'colour' },
  { us: 'colors', uk: 'colours' },
  { us: 'behavior', uk: 'behaviour' },
  { us: 'behaviors', uk: 'behaviours' },
  { us: 'customize', uk: 'customise' },
  { us: 'customization', uk: 'customisation' },
  { us: 'organization', uk: 'organisation' },
  { us: 'center', uk: 'centre' },
  { us: 'gray', uk: 'grey' },
];

export function runProseCheck(options = { checkSpelling: false, enforceSpelling: false }) {
  const files = getMdxFiles(docsRoot);
  const enforcedErrors = [];
  const spellingErrors = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const relFile = relative(landingRoot, file);

    let inCodeBlock = false;
    let ignoreNextLine = false;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // Check inline ignore
      if (line.includes('{/* prose-ignore:')) {
        ignoreNextLine = true;
        return;
      }
      if (ignoreNextLine) {
        ignoreNextLine = false;
        return;
      }

      // Track multi-line code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }
      if (inCodeBlock) return;

      // Strip inline code spans: `...`
      let prose = line.replace(/`[^`]+`/g, ' ');
      // Strip JSX tags: <Tag ... /> or </Tag>
      prose = prose.replace(/<[^>]+>/g, ' ');
      // Strip markdown link targets: [text](target) -> text
      prose = prose.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

      // 1. Check banned words
      for (const banned of BANNED_WORDS) {
        const regex = new RegExp(`\\b${banned}\\b`, 'i');
        if (regex.test(prose)) {
          enforcedErrors.push({
            file: relFile,
            line: lineNum,
            message: `Banned buzzword or marketing phrase detected: "${banned}"`,
          });
        }
      }

      // 2. Check placeholders
      for (const ph of PLACEHOLDERS) {
        const regex = new RegExp(`\\b${ph}\\b`, 'i');
        if (regex.test(prose)) {
          enforcedErrors.push({
            file: relFile,
            line: lineNum,
            message: `Generic placeholder data detected: "${ph}". Use Northwind Traders universe data instead.`,
          });
        }
      }

      // 3. Check emoji
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      if (emojiRegex.test(prose)) {
        enforcedErrors.push({
          file: relFile,
          line: lineNum,
          message: 'Emoji character detected in documentation prose',
        });
      }

      // 4. Check exclamation marks in prose
      if (/[a-zA-Z0-9]!(\s|$)/.test(prose)) {
        enforcedErrors.push({
          file: relFile,
          line: lineNum,
          message: 'Exclamation mark detected in prose. Keep tone plain, calm, and objective.',
        });
      }

      // 5. Check American spellings (report mode by default)
      for (const { us, uk } of AMERICAN_SPELLINGS) {
        const regex = new RegExp(`\\b${us}\\b`, 'i');
        if (regex.test(prose)) {
          spellingErrors.push({
            file: relFile,
            line: lineNum,
            message: `American spelling "${us}" detected. Use British English "${uk}".`,
          });
        }
      }
    });
  }

  return { enforcedErrors, spellingErrors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isEnforceSpelling = process.argv.includes('--enforce-spelling');
  const { enforcedErrors, spellingErrors } = runProseCheck({ enforceSpelling: isEnforceSpelling });

  if (enforcedErrors.length > 0) {
    console.error(`Prose check failed: ${enforcedErrors.length} banned patterns or tone violations:`);
    for (const e of enforcedErrors.slice(0, 10)) {
      console.error(`  ${e.file}:${e.line} - ${e.message}`);
    }
    if (enforcedErrors.length > 10) console.error(`  ...and ${enforcedErrors.length - 10} more.`);
    process.exit(1);
  } else {
    console.log('✓ No banned words, emoji, or invalid placeholders found in documentation prose.');
  }

  if (spellingErrors.length > 0) {
    console.log(`Spelling check (mode: ${isEnforceSpelling ? 'ENFORCE' : 'REPORT'}): ${spellingErrors.length} American spellings detected.`);
    for (const e of spellingErrors.slice(0, 5)) {
      console.log(`  ${e.file}:${e.line} - ${e.message}`);
    }
    if (spellingErrors.length > 5) console.log(`  ...and ${spellingErrors.length - 5} more.`);
    if (isEnforceSpelling) process.exit(1);
  } else {
    console.log('✓ All prose follows British English spelling.');
  }
}
