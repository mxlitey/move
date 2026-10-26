/**
 * 本地开发服务器。
 *
 * ESA 的边缘函数运行在 V8 Isolate 里，接口是 Web Standard Request/Response，
 * Node 18+ 原生支持这一套，因此可以直接跑同一份构建产物。
 * 唯一需要模拟的是 EdgeKV，这里用内存 Map + 文件持久化替代。
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, '.devdata');
// 8787 常被其他本地服务占用，默认用 8899；可用 PORT 环境变量覆盖
const PORT = Number(process.env.PORT || 8899);
const NAMESPACE = process.env.KV_NAMESPACE || 'movecar';
// 按命名空间分文件，便于用独立命名空间跑测试而不污染日常数据
const dataFile = path.join(dataDir, `kv-${NAMESPACE}.json`);

// ------------------------- EdgeKV 模拟 -------------------------
let store = {};

async function loadStore() {
  if (existsSync(dataFile)) {
    try {
      store = JSON.parse(await readFile(dataFile, 'utf8'));
    } catch {
      store = {};
    }
  }
}

let persistTimer = null;
function persist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    await mkdir(dataDir, { recursive: true });
    await writeFile(dataFile, JSON.stringify(store, null, 2), 'utf8');
  }, 120);
}

class MockEdgeKV {
  constructor(options = {}) {
    this.namespace = options.namespace || 'default';
  }
  async get(key, opts = {}) {
    const bucket = store[this.namespace] || {};
    const raw = bucket[key];
    if (raw === undefined) return undefined;
    if (opts.type === 'json') return JSON.parse(raw);
    if (opts.type === 'arrayBuffer') return new TextEncoder().encode(raw).buffer;
    if (opts.type === 'stream') return new Response(raw).body;
    // 默认按流返回，这里简化成可 await 的字符串
    return raw;
  }
  async put(key, value) {
    if (!store[this.namespace]) store[this.namespace] = {};
    let text;
    if (typeof value === 'string') text = value;
    else if (value instanceof Response) text = await value.text();
    else if (value instanceof ArrayBuffer) text = new TextDecoder().decode(value);
    else if (ArrayBuffer.isView(value)) text = new TextDecoder().decode(value);
    else text = String(value);

    if (text.length > 1.8 * 1024 * 1024) throw new Error('value 超过 1.8MB');
    if (!/^[A-Za-z0-9_-]{1,512}$/.test(key)) throw new Error(`非法 KV key: ${key}`);

    store[this.namespace][key] = text;
    persist();
    return undefined;
  }
  async delete(key) {
    const bucket = store[this.namespace];
    if (!bucket || bucket[key] === undefined) return false;
    delete bucket[key];
    persist();
    return true;
  }
}

globalThis.EdgeKV = MockEdgeKV;

// ------------------------- 加载函数 -------------------------
const entry = path.join(root, 'dist', 'index.js');
if (!existsSync(entry)) {
  console.error('未找到 dist/index.js，请先运行 npm run build');
  process.exit(1);
}

const { default: worker } = await import(`file://${entry.replace(/\\/g, '/')}?t=${Date.now()}`);

const env = {
  KV_NAMESPACE: NAMESPACE,
  ADMIN_SECRET: process.env.ADMIN_SECRET || 'local-dev-secret-0123456789abcdef',
};

await loadStore();

// ------------------------- HTTP 桥接 -------------------------
const server = createServer(async (req, res) => {
  const origin = `http://${req.headers.host || `localhost:${PORT}`}`;
  const url = new URL(req.url, origin);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value !== undefined) headers.set(key, String(value));
  }

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = Buffer.concat(chunks);
  }

  const request = new Request(url.href, {
    method: req.method,
    headers,
    body: body && body.length ? body : undefined,
    duplex: 'half',
  });

  try {
    const response = await worker.fetch(request, {}, env);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } catch (err) {
    console.error('[worker error]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Internal Error: ' + err.message);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用。`);
    console.error(`换一个端口启动：$env:PORT=9000; npm run dev   （PowerShell）`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`本地服务已启动  http://localhost:${PORT}`);
  console.log(`  后台  http://localhost:${PORT}/admin`);
  console.log(`  调试用，KV 数据存于 .devdata/kv.json`);
});
