// Runs Spectral OAS linter and scripts/lint_openapi.py checklist checker.
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const appDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appDir, '../..');
const isWin = process.platform === 'win32';
const pythonExe = path.join(appDir, '.venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python');

// 1. Run Spectral
const spectralBin = path.join(repoRoot, 'node_modules', '.bin', isWin ? 'spectral.cmd' : 'spectral');
console.log('Running Stoplight Spectral OpenAPI linter...');
const spectralResult = spawnSync(spectralBin, ['lint', path.join(appDir, 'openapi.json'), '--ruleset', path.join(appDir, '.spectral.yaml')], {
  cwd: appDir,
  stdio: 'inherit',
});

if (spectralResult.status !== 0) {
  process.exit(spectralResult.status ?? 1);
}

// 2. Run Python checklist gate
console.log('\nRunning OpenAPI checklist quality gate...');
const pythonResult = spawnSync(pythonExe, [path.join(__dirname, 'lint_openapi.py'), ...process.argv.slice(2)], {
  cwd: appDir,
  stdio: 'inherit',
  env: { ...process.env, PYTHONUTF8: '1' },
});

process.exit(pythonResult.status ?? 1);
