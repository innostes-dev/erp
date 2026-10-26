const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const pythonExe = path.join(__dirname, '.venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python');

const port = process.env.PORT || '8001';
const args = ['-m', 'fastapi', 'dev', 'app/main.py', '--port', port, ...process.argv.slice(2)];

// Plug-in modules (kernel, ERP modules) are pip-installed into .venv, so only
// this app's own folder needs to be on PYTHONPATH.
const pythonPathParts = [__dirname];
if (process.env.PYTHONPATH) {
  pythonPathParts.push(process.env.PYTHONPATH);
}

const child = spawn(pythonExe, args, {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    PYTHONPATH: pythonPathParts.join(path.delimiter),
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
  },
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
