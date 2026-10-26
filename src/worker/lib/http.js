const BASE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
};

// img-src 必须允许 blob:，后台把二维码 SVG 转成位图导出时要走 blob URL
const CSP =
  "default-src 'self'; img-src 'self' data: blob:; " +
  "style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; " +
  "base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...BASE_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function ok(data) {
  return json({ ok: true, data });
}

export function fail(code, message, status = 400) {
  return json({ ok: false, code, message }, status);
}

export function htmlPage(body, { status = 200, cache = 'no-cache' } = {}) {
  return new Response(body, {
    status,
    headers: {
      ...BASE_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': cache,
      'Content-Security-Policy': CSP,
    },
  });
}

export function svgImage(body, { cache = 'public, max-age=86400' } = {}) {
  return new Response(body, {
    status: 200,
    headers: {
      ...BASE_HEADERS,
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': cache,
    },
  });
}

export function text(body, { contentType = 'text/plain; charset=utf-8', cache = 'public, max-age=86400' } = {}) {
  return new Response(body, {
    status: 200,
    headers: { ...BASE_HEADERS, 'Content-Type': contentType, 'Cache-Control': cache },
  });
}

export function redirect(location, { status = 302 } = {}) {
  return new Response(null, {
    status,
    headers: { ...BASE_HEADERS, Location: location, 'Cache-Control': 'no-store' },
  });
}
