// Runs the api-server virtualenv's Python with the given arguments, on Windows or Unix.
// Used by Nx targets so they work on every OS:
//   node apps/api-server/scripts/venv-python.js -m unittest discover -s tests
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const appDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const pythonExe = path.join(appDir, '.venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python');

if (!fs.existsSync(pythonExe)) {
  console.error(`Python virtualenv not found at ${pythonExe}. Run: pnpm nx run api-server:install`);
  process.exit(1);
}

const pythonPath = [process.cwd(), process.env.PYTHONPATH].filter(Boolean).join(path.delimiter);

const result = spawnSync(pythonExe, process.argv.slice(2), {
  stdio: 'inherit',
  env: { ...process.env, PYTHONUTF8: '1', PYTHONPATH: pythonPath },
});
process.exit(result.status ?? 1);
