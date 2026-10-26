// Runs scripts/export_openapi.py with the app's virtualenv Python (Windows or Unix).
const { spawnSync } = require('child_process');
const path = require('path');

const appDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const pythonExe = path.join(appDir, '.venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python');

const result = spawnSync(pythonExe, [path.join(__dirname, 'export_openapi.py'), ...process.argv.slice(2)], {
  cwd: appDir,
  stdio: 'inherit',
  env: { ...process.env, PYTHONUTF8: '1' },
});
process.exit(result.status ?? 1);
