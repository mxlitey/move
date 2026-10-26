import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src');
const outDir = path.join(root, 'dist');
const genDir = path.join(srcDir, 'worker', 'generated');

async function bundleClient(entry) {
  const result = await esbuild.build({
    entryPoints: [path.join(srcDir, 'web', entry)],
    bundle: true,
    write: false,
    format: 'iife',
    target: 'es2018',
    minify: true,
    legalComments: 'none',
  });
  return result.outputFiles[0].text;
}

async function buildWeb() {
  const css = await readFile(path.join(srcDir, 'web', 'styles.css'), 'utf8');
  const parkJs = await bundleClient('park.js');
  const adminJs = await bundleClient('admin.js');

  await mkdir(genDir, { recursive: true });
  await writeFile(
    path.join(genDir, 'assets.js'),
    `// 由 build/build.mjs 自动生成，请勿手动修改
export const CSS = ${JSON.stringify(css)};
export const PARK_JS = ${JSON.stringify(parkJs)};
export const ADMIN_JS = ${JSON.stringify(adminJs)};
`,
    'utf8'
  );

  return { css: css.length, park: parkJs.length, admin: adminJs.length };
}

/**
 * 扫码页用到的两张装饰图。以 base64 随函数一起发布，
 * 由 /assets/* 路由按静态资源返回，HTML 里只留一个短链接。
 */
async function buildMedia() {
  const files = [
    { name: 'sea.svg', file: 'footer-sea.svg', type: 'image/svg+xml; charset=utf-8' },
    { name: 'bg.webp', file: 'home_bg.webp', type: 'image/webp' },
  ];

  const entries = [];
  for (const item of files) {
    const buf = await readFile(path.join(srcDir, 'web', 'assets', item.file));
    entries.push(`  ${JSON.stringify(item.name)}: { type: ${JSON.stringify(item.type)}, data: ${JSON.stringify(buf.toString('base64'))} },`);
  }

  await writeFile(
    path.join(genDir, 'media.js'),
    `// 由 build/build.mjs 自动生成，请勿手动修改
export const MEDIA = {
${entries.join('\n')}
};
`,
    'utf8'
  );

  return files.length;
}

async function buildWorker() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const result = await esbuild.build({
    entryPoints: [path.join(srcDir, 'worker', 'index.js')],
    bundle: true,
    write: false,
    format: 'esm',
    target: 'es2020',
    minify: false,
    legalComments: 'none',
  });

  const code = result.outputFiles[0].text;
  const bytes = Buffer.byteLength(code, 'utf8');
  const sizeKb = (bytes / 1024).toFixed(1);

  if (bytes > 4 * 1024 * 1024) {
    throw new Error(`函数代码 ${sizeKb} KB，超过 4 MB 上限`);
  }

  await writeFile(path.join(outDir, 'index.js'), code, 'utf8');
  return sizeKb;
}

async function main() {
  if (!existsSync(path.join(root, 'node_modules'))) {
    throw new Error('请先运行 npm install');
  }

  const web = await buildWeb();
  const media = await buildMedia();
  const worker = await buildWorker();

  console.log('构建完成');
  console.log(`  样式     ${(web.css / 1024).toFixed(1)} KB`);
  console.log(`  扫码页   ${(web.park / 1024).toFixed(1)} KB`);
  console.log(`  后台     ${(web.admin / 1024).toFixed(1)} KB`);
  console.log(`  装饰图   ${media} 张（base64 内联）`);
  console.log(`  产物     dist/index.js  ${worker} KB（上限 4 MB）`);
}

main().catch((err) => {
  console.error('构建失败:', err.message);
  process.exit(1);
});
