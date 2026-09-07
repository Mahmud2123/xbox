import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'vercel.cmd' : 'vercel';
const child = spawn(command, ['dev'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code ?? 1);
});