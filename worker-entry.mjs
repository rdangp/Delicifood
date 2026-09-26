import app from './dist/server/index.js';
import { verifyAccess, sanitizedHeaders } from './hosting/access.mjs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/signin-with-chatgpt') return Response.redirect(url.origin + '/admin', 302);
    if (url.pathname === '/signout-with-chatgpt') return Response.redirect(url.origin + '/cdn-cgi/access/logout', 302);
    const headers = sanitizedHeaders(request.headers);
    // The packaged app must never trust identity headers sent by a visitor.
    // Identity reaches the application only after verifying Access's signature.
    const protectedPath = /^\/(admin(?:\/|$)|api\/(admin|upload)(?:\/|$))/.test(decodeURIComponent(url.pathname));
    if (protectedPath) {
      try {
        const user = await verifyAccess(request.headers.get('Cf-Access-Jwt-Assertion'), env);
        const allow = String(env.ADMIN_EMAIL || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (!allow.includes(user.email.toLowerCase())) throw Error('Akun tidak diizinkan');
        headers.set('oai-authenticated-user-id', user.sub);
        headers.set('oai-authenticated-user-email', user.email);
      } catch {
        return new Response('Akses admin ditolak. Konfigurasikan Cloudflare Access untuk /admin, /api/admin, dan /api/upload, lalu masuk dengan email pemilik.', {
          status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }
    }
    return app.fetch(new Request(request, { headers }), env, ctx);
  }
};
