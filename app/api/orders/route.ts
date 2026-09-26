import { catalog, db, error, sameOrigin, body } from '@/lib/server';
import { rupiah } from '@/lib/shop';
import { z } from 'zod';
const schema = z.object({ token: z.string().uuid(), name: z.string().trim().min(2).max(100), phone: z.string().regex(/^(\+?62|0)8\d{7,12}$/), address: z.string().trim().min(10).max(1000), note: z.string().max(1000), items: z.array(z.object({ variant: z.string().max(100), qty: z.number().int().min(1).max(100) })).min(1).max(30) });
export async function POST(r: Request) {
    try {
        sameOrigin(r);
        if (Number(r.headers.get('content-length') || 0) > 20000)
            throw Error('Pesanan terlalu besar.');
        const b = schema.parse(await body(r, 20000));
        const d = db();
        const { products, settings } = await catalog();
        const existing = await d.prepare('SELECT id,data,total FROM orders WHERE token=?').bind(b.token).first<any>();
        let order: any;
        if (existing) {
            order = { id: existing.id, ...JSON.parse(existing.data), total: existing.total };
        }
        else {
            const ids = new Set();
            const items = b.items.map(i => { if (ids.has(i.variant))
                throw Error('Varian ganda.'); ids.add(i.variant); const p = products.find((p: any) => p.variants.some((v: any) => v.id === i.variant)); const v = p?.variants.find((v: any) => v.id === i.variant); if (!v || v.stock < i.qty)
                throw Error('Stok berubah. Perbarui keranjang Anda.'); return { variant: v.id, product: p.id, name: p.name, option: v.name, price: v.price, qty: i.qty, demo: p.demo, image: p.image }; });
            const total = items.reduce((n, i) => n + i.price * i.qty, 0);
            order = { id: 'DF-' + crypto.randomUUID().slice(0, 8).toUpperCase(), name: b.name, phone: b.phone, address: b.address, note: b.note, items, total };
            try {
                await d.batch([d.prepare('INSERT INTO orders(id,token,data,total,demo,created) VALUES (?,?,?,CASE WHEN ' + items.map(() => 'EXISTS(SELECT 1 FROM variants v JOIN products p ON p.id=v.product_id WHERE v.id=? AND v.price=? AND v.stock>=? AND p.active=1)').join(' AND ') + ' THEN ? ELSE NULL END,?,?)').bind(order.id, b.token, JSON.stringify(order), ...items.flatMap(i => [i.variant, i.price, i.qty]), total, items.some(i => i.demo) ? 1 : 0, new Date().toISOString()), ...items.map(i => d.prepare('UPDATE variants SET stock=CASE WHEN price=? AND EXISTS(SELECT 1 FROM products WHERE id=? AND active=1) THEN stock-? ELSE -1 END WHERE id=?').bind(i.price, i.product, i.qty, i.variant))]);
            }
            catch {
                const prior = await d.prepare('SELECT id,data,total FROM orders WHERE token=?').bind(b.token).first<any>();
                if (!prior)
                    throw Error('Stok tidak cukup atau pesanan gagal disimpan. Perbarui keranjang.');
                order = { id: prior.id, ...JSON.parse(prior.data), total: prior.total };
            }
        }
        const message = `Halo ${settings.name}, saya ingin memesan.\nPesanan: ${order.id}\n${order.items.some((i: any) => i.demo) ? '[PESANAN DEMO — bukan transaksi nyata]\n' : ''}\n${order.items.map((i: any) => `${i.name} (${i.option}) × ${i.qty} — ${rupiah(i.price * i.qty)}`).join('\n')}\n\nSubtotal: ${rupiah(order.total)}\nOngkir: Dikonfirmasi oleh penjual\nTotal akhir: ${rupiah(order.total)} + ongkir\n\nNama: ${order.name}\nWhatsApp: ${order.phone}\nAlamat: ${order.address}\nCatatan: ${order.note || '-'}\n\nMohon konfirmasi ketersediaan dan pembayaran.`;
        return Response.json({ id: order.id, url: `https://wa.me/${settings.phone.replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, total: order.total });
    }
    catch (e) {
        return error(e);
    }
}
