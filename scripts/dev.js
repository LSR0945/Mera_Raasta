import { spawn } from 'child_process';
import treeKill from 'tree-kill';

const procs = [];

function killAll() {
  procs.forEach(p => {
    if (p.pid) treeKill(p.pid, 'SIGTERM', () => {});
  });
}

process.on('SIGINT', () => { killAll(); process.exit(0); });
process.on('SIGTERM', () => { killAll(); process.exit(0); });
process.stdin.on('end', () => { killAll(); process.exit(0); });

const backend = spawn('node', ['src/index.js'], { cwd: 'backend', stdio: 'inherit', shell: true });
procs.push(backend);

const frontend = spawn('npx', ['vite', '--host'], { cwd: 'frontend', stdio: 'inherit', shell: true });
procs.push(frontend);

console.log('Starting backend and frontend...');
