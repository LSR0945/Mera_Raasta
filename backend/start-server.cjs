const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const out = fs.openSync(path.join(__dirname, 'server_out.log'), 'a');
const child = spawn('node', ['src/index.js'], {
  cwd: path.resolve(__dirname),
  detached: true,
  stdio: ['ignore', out, out]
});
child.unref();
console.log('PID:', child.pid);
