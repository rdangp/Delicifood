import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { defaults, demoProducts } from './shop';
import { ZodError } from 'zod';
export function db() { if (!env.DB)
    throw Error('Database belum tersedia. Coba lagi nanti.'); return env.DB; }
export async function admin() { const u = await getChatGPTUser(); const allowed = String((env as any).ADMIN_EMAIL || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean); return !!u && allowed.includes(u.email.toLowerCase()); }
export function sameOrigin(r: Request) { if (r.headers.get('origin') !== new URL(r.url).origin)
    throw Error('Permintaan tidak diizinkan.'); }
export async function init() { const d = db(); if (await d.prepare('SELECT id FROM settings WHERE id=?').bind('shop').first())
    return; await d.batch([d.prepare('INSERT OR IGNORE INTO settings(id,data) VALUES (?,?)').bind('shop', JSON.stringify(defaults)), ...demoProducts.flatMap(p => [d.prepare('INSERT OR IGNORE INTO products(id,data) VALUES (?,?)').bind(p.id, JSON.stringify(p)), ...p.variants.map(v => d.prepare('INSERT OR IGNORE INTO variants(id,product_id,name,price,stock) VALUES (?,?,?,?,?)').bind(v.id, p.id, v.name, v.price, v.stock))])]); }
export async function catalog() { await init(); const d = db(); const ps = await d.prepare('SELECT * FROM products WHERE active=1').all<any>(); const vs = await d.prepare('SELECT * FROM variants').all<any>(); const s = await d.prepare('SELECT data FROM settings WHERE id=?').bind('shop').first<any>(); return { products: ps.results.map(p => ({ ...JSON.parse(p.data), variants: vs.results.filter(v => v.product_id === p.id) })), settings: JSON.parse(s.data) }; }
export function error(e: unknown, status = 400) { console.error(e); return Response.json({ error: e instanceof ZodError ? 'Periksa isian: ' + e.issues.map(x => x.path.join('.') + ' — ' + x.message).join('; ') : e instanceof Error && !e.message.includes('D1_') ? e.message : 'Data gagal disimpan. Silakan periksa stok atau coba kembali.' }, { status, headers: { 'Cache-Control': 'no-store' } }); }
export async function body(r: Request, max = 100000) { const s = await r.text(); if (s.length > max)
    throw Error('Data terlalu besar.'); return JSON.parse(s); }
