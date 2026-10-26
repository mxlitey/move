/**
 * 一键回归测试。
 *
 * 用独立的 KV 命名空间和端口另起一个服务实例，跑完即关闭，
 * 这样既不会污染 .devdata 里的日常数据，也不依赖你手动启动服务。
 *
 * 用法：npm test
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8901;

const server = spawn(process.execPath, [path.join(root, 'dev', 'server.mjs')], {
  cwd: root,
  env: { ...process.env, PORT: String(PORT), KV_NAMESPACE: 'movecar_test' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let ready = false;

server.stdout.on('data', (chunk) => {
  if (String(chunk).includes('本地服务已启动')) ready = true;
});
server.stderr.on('data', (chunk) => process.stderr.write(chunk));

function shutdown(code) {
  server.kill();
  process.exit(code);
}

const waitStart = async () => {
  for (let i = 0; i < 60; i++) {
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
};

const started = await waitStart();
if (!started) {
  console.error('测试服务启动失败');
  shutdown(1);
}

const runner = spawn(
  process.execPath,
  [path.join(root, 'dev', 'smoke.mjs'), `http://localhost:${PORT}`],
  { cwd: root, stdio: 'inherit' }
);

runner.on('exit', (code) => shutdown(code ?? 1));
