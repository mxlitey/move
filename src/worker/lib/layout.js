import { htmlPage } from './http.js';

/**
 * 统一的 HTML 文档外壳。
 * 所有样式与脚本在构建期被内联成字符串，最终只有一个函数文件。
 */
export function documentShell({ title, css, script, bodyClass, body, cache = 'no-cache' }) {
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="format-detection" content="telephone=no">
<meta name="theme-color" content="#1677ff">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body class="${bodyClass}">
${body}
<script>${script}</script>
</body>
</html>`;
  return htmlPage(html, { cache });
}

export function escapeHtml(input) {
  return String(input == null ? '' : input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeJsonForScript(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
