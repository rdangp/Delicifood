import { admin, body, catalog, db, error, sameOrigin } from '@/lib/server';
import { z } from 'zod';
const image = z.string().max(300).regex(/^\/(images\/[\w.-]+|api\/images\/[\w.-]+)$/, 'Gunakan foto yang diunggah.');
const product = z.object({ id: z.string().min(1).max(100), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(150), name: z.string().trim().min(2).max(150), category: z.string().trim().min(1).max(80), description: z.string().max(4000), spec: z.string().max(2000), weight: z.number().int().min(1).max(100000), image, images: z.array(image).max(6).optional(), featured: z.boolean(), demo: z.boolean(), created: z.number(), variants: z.array(z.object({ id: z.string().min(1).max(100), name: z.string().trim().min(1).max(100), price: z.number().int().min(1).max(100000000), stock: z.number().int().min(0).max(1000000) })).min(1).max(30) });
const settingsSchema = z.object({ name: z.string().trim().min(2).max(80), phone: z.string().regex(/^(\+?62|0)8\d{7,12}$/), instagram: z.string().regex(/^[\w.]{1,30}$/), location: z.string().min(2).max(200), banner: z.string().min(2).max(120), bannerImage: image.optional(), about: z.string().max(5000), shipping: z.string().max(10000), returns: z.string().max(10000), privacy: z.string().max(10000), terms: z.string().max(10000) });
export async function GET() { if (!await admin())
    return Response.json({ error: 'Akses ditolak' }, { status: 403 }); try {
    const data = await catalog();
    const result = await db().prepare('SELECT * FROM orders ORDER BY created DESC LIMIT 500').all<any>();
    const stats = await db().prepare("SELECT COUNT(*) AS totalOrders, SUM(CASE WHEN demo=0 THEN 1 ELSE 0 END) AS realOrders, SUM(CASE WHEN demo=0 AND payment='dibayar' AND status!='dibatalkan' THEN total ELSE 0 END) AS sales FROM orders").first();
    return Response.json({ ...data, orders: result.results.map(o => ({ ...o, ...JSON.parse(o.data) })), stats }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return error(e, 503);
} }
export async function POST(r: Request) { if (!await admin())
    return Response.json({ error: 'Akses ditolak' }, { status: 403 }); try {
    sameOrigin(r);
    const b = await body(r);
    const d = db();
    if (b.action === 'product') {
        const p = product.parse(b.product);
        if (new Set(p.variants.map(v => v.id)).size !== p.variants.length)
            throw Error('ID varian harus unik.');
        const all = await d.prepare('SELECT id,data FROM products WHERE active=1 AND id!=?').bind(p.id).all<any>();
        if (all.results.some(x => JSON.parse(x.data).slug === p.slug))
            throw Error('URL produk sudah digunakan.');
        const variants = await d.prepare('SELECT id,product_id FROM variants').all<any>();
        if (p.variants.some(v => variants.results.some(x => x.id === v.id && x.product_id !== p.id)))
            throw Error('Varian tidak valid.');
        await d.batch([d.prepare('INSERT INTO products(id,data,active) VALUES (?,?,1) ON CONFLICT(id) DO UPDATE SET data=excluded.data,active=1').bind(p.id, JSON.stringify(p)), d.prepare('DELETE FROM variants WHERE product_id=?').bind(p.id), ...p.variants.map(v => d.prepare('INSERT INTO variants(id,product_id,name,price,stock) VALUES (?,?,?,?,?)').bind(v.id, p.id, v.name, v.price, v.stock))]);
    }
    else if (b.action === 'delete') {
        const id = z.string().max(100).parse(b.id);
        await d.prepare('UPDATE products SET active=0 WHERE id=?').bind(id).run();
    }
    else if (b.action === 'settings') {
        const s = settingsSchema.parse(b.settings);
        await d.prepare('UPDATE settings SET data=? WHERE id=?').bind(JSON.stringify(s), 'shop').run();
    }
    else if (b.action === 'order') {
        const v = z.object({ id: z.string().max(100), status: z.enum(['menunggu konfirmasi', 'menunggu pembayaran', 'diproses', 'dikirim', 'selesai', 'dibatalkan']), payment: z.enum(['belum dibayar', 'dibayar', 'dikembalikan']), tracking: z.string().max(150) }).parse(b);
        const o = await d.prepare('SELECT * FROM orders WHERE id=?').bind(v.id).first<any>();
        if (!o)
            throw Error('Pesanan tidak ditemukan.');
        if (o.status === 'dibatalkan' && v.status !== 'dibatalkan')
            throw Error('Pesanan dibatalkan tidak dapat diaktifkan ulang. Buat pesanan baru.');
        if (['dikirim', 'selesai'].includes(v.status) && v.payment !== 'dibayar')
            throw Error('Konfirmasi pembayaran sebelum pengiriman.');
        if (v.status === 'dikirim' && !v.tracking.trim())
            throw Error('Isi resi atau keterangan pengiriman.');
        const statements = [d.prepare('UPDATE orders SET status=?,payment=?,tracking=? WHERE id=?').bind(v.status, v.payment, v.tracking, v.id)];
        if (v.status === 'dibatalkan' && o.status !== 'dibatalkan') {
            const items = JSON.parse(o.data).items;
            for (const i of items)
                statements.unshift(d.prepare("UPDATE variants SET stock=stock+? WHERE id=? AND EXISTS(SELECT 1 FROM orders WHERE id=? AND status!='dibatalkan')").bind(i.qty, i.variant, v.id));
        }
        await d.batch(statements);
    }
    else
        throw Error('Aksi tidak dikenal.');
    return Response.json({ ok: true });
}
catch (e) {
    return error(e);
} }
