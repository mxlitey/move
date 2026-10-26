import { fail } from './lib/http.js';
import { handleHome, handleDemoPage, handleParkPage, handleQrSvg, handleRobots } from './handlers/publicPages.js';
import { handleContact } from './handlers/publicApi.js';
import {
  handleAdminPage,
  handleLogin,
  handleInit,
  handleLogout,
  handleSession,
  handleSavePage,
  handleResetId,
  handleSaveCar,
  handleDeleteCar,
  handleReorderCars,
  handleChangePassword,
} from './handlers/adminApi.js';

export default {
  async fetch(request, context, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method.toUpperCase();

    try {
      if (method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: { Allow: 'GET, POST, PUT, DELETE, OPTIONS' } });
      }

      // ---------- 静态 ----------
      if (path === '/robots.txt') return handleRobots();

      // ---------- 扫码页 ----------
      const parkMatch = path.match(/^\/p\/([^/]+)$/);
      if (parkMatch) {
        if (method !== 'GET') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
        return handleParkPage(env, request, parkMatch[1]);
      }

      const qrMatch = path.match(/^\/p\/([^/]+)\/qr\.svg$/);
      if (qrMatch) {
        if (method !== 'GET') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
        return handleQrSvg(env, request, qrMatch[1]);
      }

      // ---------- 公开接口 ----------
      const contactMatch = path.match(/^\/api\/p\/([^/]+)\/contact$/);
      if (contactMatch) {
        if (method !== 'POST') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
        if (!isSameOrigin(request)) return fail('FORBIDDEN', '非法来源', 403);
        return handleContact(env, request, contactMatch[1]);
      }

      // ---------- 后台页面 ----------
      if (path === '/admin' || path === '/admin/') {
        if (method !== 'GET') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
        return handleAdminPage(env, request);
      }

      // ---------- 后台接口 ----------
      if (path.startsWith('/api/admin/')) {
        if (method !== 'GET' && method !== 'POST' && method !== 'PUT' && method !== 'DELETE') {
          return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
        }
        if (method !== 'GET' && !isSameOrigin(request)) return fail('FORBIDDEN', '非法来源', 403);

        switch (path) {
          case '/api/admin/init':
            if (method !== 'POST') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
            return handleInit(env, request);
          case '/api/admin/login':
            if (method !== 'POST') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
            return handleLogin(env, request);
          case '/api/admin/logout':
            if (method !== 'POST') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
            return handleLogout(env, request);
          case '/api/admin/session':
            if (method !== 'GET') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
            return handleSession(env, request);
          case '/api/admin/page':
            if (method !== 'PUT') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
            return handleSavePage(env, request);
          case '/api/admin/page/reset-id':
            if (method !== 'POST') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
            return handleResetId(env, request);
          case '/api/admin/car':
            if (method === 'POST') return handleSaveCar(env, request);
            if (method === 'DELETE') return handleDeleteCar(env, request, url);
            return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
          case '/api/admin/cars/order':
            if (method !== 'POST') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
            return handleReorderCars(env, request);
          case '/api/admin/password':
            if (method !== 'POST') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
            return handleChangePassword(env, request);
          default:
            return fail('NOT_FOUND', '接口不存在', 404);
        }
      }

      // ---------- 首页 ----------
      if (path === '/' || path === '/index.html') {
        if (method !== 'GET') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
        return handleHome();
      }

      // ---------- 示例扫码页（固定假数据） ----------
      if (path === '/demo') {
        if (method !== 'GET') return fail('METHOD_NOT_ALLOWED', '方法不允许', 405);
        return handleDemoPage();
      }

      return fail('NOT_FOUND', '页面不存在', 404);
    } catch (err) {
      // 不打印请求体与会话，避免手机号泄露到日志
      return fail('INTERNAL', '服务异常，请稍后重试', 500);
    }
  },
};

function isSameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // 同源 GET 或非浏览器客户端
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
