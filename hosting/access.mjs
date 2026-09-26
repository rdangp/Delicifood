const keyCache = new Map();
const decode = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const json = value => JSON.parse(new TextDecoder().decode(decode(value)));

export async function verifyAccess(token, env) {
  const issuer = String(env.CF_ACCESS_TEAM_DOMAIN || '').replace(/\/$/, '');
  const audiences = String(env.CF_ACCESS_AUD || '').split(',').map(x => x.trim()).filter(Boolean);
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) || !audiences.length) throw Error('Access belum dikonfigurasi');
  if (!token || token.length > 16000) throw Error('Login diperlukan');
  const parts = token.split('.');
  if (parts.length !== 3) throw Error('Token tidak valid');
  const header = json(parts[0]);
  const claims = json(parts[1]);
  const now = Date.now() / 1000;
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || claims.iss !== issuer ||
      !Array.isArray(claims.aud) || !claims.aud.some(a => audiences.includes(a)) ||
      typeof claims.exp !== 'number' || claims.exp <= now ||
      (claims.nbf !== undefined && (typeof claims.nbf !== 'number' || claims.nbf > now + 30)) ||
      typeof claims.sub !== 'string' || !claims.sub || typeof claims.email !== 'string') throw Error('Token tidak valid');
  let entry = keyCache.get(issuer);
  if (!entry || entry.until < Date.now()) {
    const response = await fetch(issuer + '/cdn-cgi/access/certs');
    if (!response.ok) throw Error('Validasi login tidak tersedia');
    const { keys } = await response.json();
    if (!Array.isArray(keys)) throw Error('Kunci tidak valid');
    entry = { keys, until: Date.now() + 300000 };
    keyCache.set(issuer, entry);
  }
  const jwk = entry.keys.find(k => k.kid === header.kid && k.kty === 'RSA');
  if (!jwk) throw Error('Kunci login belum tersedia; coba lagi beberapa menit');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!valid) throw Error('Signature tidak valid');
  return claims;
}

export function sanitizedHeaders(headers) {
  const clean = new Headers(headers);
  for (const name of [...clean.keys()]) {
    if (name.startsWith('oai-') || name.startsWith('x-middleware-') || name.startsWith('x-nextjs-')) clean.delete(name);
  }
  return clean;
}
