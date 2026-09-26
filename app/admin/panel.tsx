'use client';
import { newId } from '@/lib/id';
import { useEffect, useState } from 'react';
import { Plus, ArrowUpRight, LogOut, Upload } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Toaster, toast } from 'sonner';
import { Choice } from '@/app/storefront';
import { rupiah } from '@/lib/shop';
export default function Admin() {
    const [data, setData] = useState<any>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [edit, setEdit] = useState<any>(null), [order, setOrder] = useState<any>(null), [remove, setRemove] = useState('');
    async function load() { try {
        const r = await fetch('/api/admin');
        const j: any = await r.json();
        if (!r.ok)
            throw Error(j.error);
        setData(j);
        setError('');
    }
    catch (e: any) {
        setError(e.message);
    } }
    useEffect(() => { load(); }, []);
    async function save(payload: any) { setBusy(true); try {
        const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const j: any = await r.json();
        if (!r.ok)
            throw Error(j.error);
        toast.success('Perubahan disimpan');
        await load();
        setEdit(null);
        setOrder(null);
        return true;
    }
    catch (e: any) {
        toast.error(e.message);
        return false;
    }
    finally {
        setBusy(false);
    } }
    async function upload(file: File | undefined, target: string) { if (!file)
        return; if (file.size > 5 * 1024 * 1024) {
        toast.error('Foto maksimal 5 MB');
        return;
    } setBusy(true); try {
        const fd = new FormData();
        fd.set('file', file);
        const r = await fetch('/api/upload', { method: 'POST', body: fd });
        const j: any = await r.json();
        if (!r.ok)
            throw Error(j.error);
        if (target === 'banner')
            setData((d: any) => ({ ...d, settings: { ...d.settings, bannerImage: j.url } }));
        else if (target === 'gallery')
            setEdit((p: any) => ({ ...p, images: [...(p.images || []), j.url].slice(0, 6) }));
        else
            setEdit((p: any) => ({ ...p, image: j.url }));
        toast.success('Foto diunggah. Simpan perubahan untuk menerapkan.');
    }
    catch (e: any) {
        toast.error(e.message);
    }
    finally {
        setBusy(false);
    } }
    const field = (label: string, key: string, textarea = false) => <label className="field" key={key}>{label}{textarea ? <textarea value={edit?.[key] || ''} onChange={e => setEdit({ ...edit, [key]: e.target.value })}/> : <input required value={edit?.[key] || ''} onChange={e => setEdit({ ...edit, [key]: e.target.value })}/>}</label>;
    return <main className="admin-shell"><Toaster richColors/><header className="admin-top"><div><a className="brand" href="/">delici<span>food</span><i>✳</i></a><h1>Ruang pemilik</h1></div><div className="flex gap-5"><a href="/" className="text-link">Lihat toko <ArrowUpRight size={17}/></a><a href="/signout-with-chatgpt?return_to=%2F" className="text-link">Keluar <LogOut size={16}/></a></div></header>{error ? <div className="notice">{error} <button onClick={load}>Coba lagi</button></div> : !data ? <p role="status">Memuat dashboard…</p> : <><div className="admin-stats"><div>Pesanan nyata<strong>{data.stats.realOrders || 0}</strong></div><div>Penjualan terbayar<strong>{rupiah(data.stats.sales || 0)}</strong></div><div>Semua pesanan, termasuk demo<strong>{data.stats.totalOrders || 0}</strong></div></div><p className="demo-note">Penjualan hanya menghitung subtotal produk dari pesanan nyata berstatus dibayar, selain pesanan dibatalkan. Ongkir dan pesanan demo tidak dihitung.</p><Tabs defaultValue="products"><TabsList className="admin-tabs"><TabsTrigger value="products">Produk</TabsTrigger><TabsTrigger value="orders">Pesanan</TabsTrigger><TabsTrigger value="settings">Pengaturan</TabsTrigger><TabsTrigger value="help">Panduan</TabsTrigger></TabsList><TabsContent value="products"><div className="section-heading"><h2>Koleksi produk</h2><button className="btn" onClick={() => setEdit({ id: newId(), slug: '', name: '', category: 'Makanan', description: '', spec: '', weight: 100, image: '', images: [], demo: true, featured: false, created: Date.now(), variants: [{ id: newId(), name: 'Original', price: 10000, stock: 0 }] })}><Plus size={18}/>Produk baru</button></div><Table className="admin-table"><TableHeader><TableRow><TableHead>Produk</TableHead><TableHead>Kategori</TableHead><TableHead>Harga mulai</TableHead><TableHead>Stok</TableHead><TableHead>Jenis</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{data.products.map((p: any) => <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell>{p.category}</TableCell><TableCell>{rupiah(Math.min(...p.variants.map((v: any) => v.price)))}</TableCell><TableCell>{p.variants.reduce((n: number, v: any) => n + v.stock, 0)}</TableCell><TableCell>{p.demo ? 'Demo' : 'Nyata'}</TableCell><TableCell><button onClick={() => setEdit(structuredClone(p))}>Edit</button><button onClick={() => setRemove(p.id)}>Hapus</button></TableCell></TableRow>)}</TableBody></Table>{!data.products.length && <p className="empty">Belum ada produk. Tambahkan produk pertama.</p>}</TabsContent><TabsContent value="orders"><h2>Pesanan masuk</h2><p className="demo-note">500 pesanan terbaru. Ringkasan di atas mencakup seluruh pesanan.</p><Table className="admin-table"><TableHeader><TableRow>{['Pesanan', 'Pelanggan', 'Subtotal', 'Status pesanan', 'Pembayaran', 'Aksi'].map(x => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader><TableBody>{data.orders.map((o: any) => <TableRow key={o.id}><TableCell>{o.id}{!!o.demo && ' · Demo'}<br /><small>{new Date(o.created).toLocaleString('id-ID')}</small></TableCell><TableCell>{o.name}</TableCell><TableCell>{rupiah(o.total)}</TableCell><TableCell>{o.status}</TableCell><TableCell>{o.payment}</TableCell><TableCell><button onClick={() => setOrder(o)}>Detail</button></TableCell></TableRow>)}</TableBody></Table>{!data.orders.length && <div className="empty"><h3>Belum ada pesanan.</h3><p>Pesanan checkout akan muncul di sini.</p></div>}</TabsContent><TabsContent value="settings"><h2>Identitas & kebijakan</h2><form onSubmit={e => { e.preventDefault(); save({ action: 'settings', settings: data.settings }); }}>{Object.entries({ name: 'Nama toko', phone: 'WhatsApp toko', instagram: 'Username Instagram', location: 'Lokasi pengiriman', banner: 'Judul banner (pisahkan baris dengan Enter)', about: 'Tentang kami', shipping: 'Kebijakan pengiriman', returns: 'Retur & pengembalian dana', privacy: 'Kebijakan privasi', terms: 'Ketentuan penggunaan' }).map(([key, label]) => <label className="field" key={key}>{label}{['name', 'phone', 'instagram', 'location'].includes(key) ? <input required value={data.settings[key]} onChange={e => setData({ ...data, settings: { ...data.settings, [key]: e.target.value } })}/> : <textarea required value={data.settings[key]} onChange={e => setData({ ...data, settings: { ...data.settings, [key]: e.target.value } })}/>}</label>)}<label className="field">Ganti foto banner (JPG/PNG/WebP, maks. 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => upload(e.target.files?.[0], 'banner')}/></label>{data.settings.bannerImage && <img src={data.settings.bannerImage} alt="Banner" width="200"/>}<button className="btn" disabled={busy}>Simpan pengaturan</button></form></TabsContent><TabsContent value="help"><h2>Panduan pemilik</h2><div className="policy-text"><p>1. Buka tab Produk. Edit produk demo atau tambah produk dengan foto dan informasi yang telah diverifikasi. Hilangkan tanda Demo hanya untuk produk asli yang siap dijual.</p><p>2. Stok dicatat per varian. Checkout yang berhasil menyimpan pesanan langsung mengurangi stok sebagai reservasi. Batalkan pesanan yang tidak dilanjutkan untuk mengembalikan stok.</p><p>3. Buka detail pesanan. Konfirmasi ongkir dan instruksi pembayaran melalui WhatsApp. Ubah status pembayaran menjadi Dibayar hanya setelah dana benar-benar diterima.</p><p>4. Status pesanan: menunggu konfirmasi → menunggu pembayaran → diproses → dikirim → selesai. Status pembayaran terpisah. Isi nomor resi saat pengiriman.</p><p>5. Pengaturan menyimpan identitas, kontak, banner dan kebijakan. Tinjau kebijakan awal sebelum menerima transaksi nyata.</p><p>6. Katalog pelanggan dapat diakses publik. Akses admin membutuhkan masuk melalui Cloudflare Access dan email yang terdaftar di environment ADMIN_EMAIL. Tidak ada password yang disimpan di frontend.</p><p>7. Pembayaran online dan tarif ongkir otomatis belum diaktifkan. Integrasi memerlukan akun penyedia, API key server, webhook terverifikasi, dan pengujian sandbox.</p><p>Dokumentasi teknis: README.md dan PANDUAN.md di proyek.</p></div></TabsContent></Tabs></>}
    <Dialog open={!!edit} onOpenChange={o => !o && setEdit(null)}><DialogContent className="shop-dialog"><DialogTitle>Edit produk</DialogTitle><DialogDescription>Harga dalam Rupiah dan stok per varian.</DialogDescription>{edit && <form onSubmit={e => { e.preventDefault(); save({ action: 'product', product: edit }); }}><div className="admin-product-form">{field('Nama produk', 'name')}{field('URL produk (huruf kecil dan tanda hubung)', 'slug')}{field('Kategori', 'category')}<label className="field">Berat (gram)<input type="number" min="1" max="100000" required value={edit.weight} onChange={e => setEdit({ ...edit, weight: +e.target.value })}/></label><div className="wide">{field('Deskripsi', 'description', true)}{field('Spesifikasi, komposisi, alergen, ukuran', 'spec', true)}</div></div><label className="field">Foto utama (maks. 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => upload(e.target.files?.[0], 'main')}/></label>{edit.image && <img src={edit.image} width="100" alt="Foto utama"/>}<label className="field">Tambah foto galeri (maks. 6 foto)<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || (edit.images?.length || 0) >= 6} onChange={e => upload(e.target.files?.[0], 'gallery')}/></label><div className="admin-imgs">{edit.images?.map((src: string, i: number) => <div key={src}><img src={src} alt={'Galeri ' + (i + 1)}/><button type="button" onClick={() => setEdit({ ...edit, images: edit.images.filter((_: any, n: number) => n !== i) })}>Hapus</button></div>)}</div><div className="flex gap-6 my-5">{[['demo', 'Produk demo'], ['featured', 'Produk unggulan']].map(([k, l]) => <label className="flex items-center gap-2 text-sm" key={k}><Checkbox checked={edit[k]} onCheckedChange={v => setEdit({ ...edit, [k]: v === true })}/>{l}</label>)}</div><h3>Varian</h3><p className="demo-note">Nama varian · Harga (Rp) · Stok</p>{edit.variants.map((v: any, i: number) => <div className="variant-edit" key={v.id}>{['name', 'price', 'stock'].map(k => <input key={k} aria-label={k === 'name' ? 'Nama varian' : k === 'price' ? 'Harga varian' : 'Stok varian'} required type={k === 'name' ? 'text' : 'number'} min={k === 'price' ? 1 : 0} value={v[k]} onChange={e => setEdit({ ...edit, variants: edit.variants.map((x: any, n: number) => n === i ? { ...x, [k]: k === 'name' ? e.target.value : +e.target.value } : x) })}/>)}<button type="button" disabled={edit.variants.length === 1} onClick={() => setEdit({ ...edit, variants: edit.variants.filter((_: any, n: number) => n !== i) })}>Hapus</button></div>)}<button type="button" className="text-link my-4" onClick={() => setEdit({ ...edit, variants: [...edit.variants, { id: newId(), name: '', price: 10000, stock: 0 }] })}>+ Tambah varian</button><button className="btn full" disabled={busy || !edit.image}>{busy ? 'Menyimpan…' : 'Simpan produk'}</button>{!edit.image && <p className="demo-note">Unggah foto utama sebelum menyimpan.</p>}</form>}</DialogContent></Dialog>
    <Dialog open={!!order} onOpenChange={o => !o && setOrder(null)}><DialogContent className="shop-dialog"><DialogTitle>{order?.id}</DialogTitle><DialogDescription>Data pelanggan hanya tersedia untuk pemilik.</DialogDescription>{order && <div className="order-detail"><p><b>{order.name}</b><br />{order.phone}<br />{order.address}</p><p>Catatan: {order.note || '—'}</p>{order.items.map((i: any) => <p key={i.variant}>{i.name} · {i.option} × {i.qty}<br /><b>{rupiah(i.qty * i.price)}</b></p>)}<p><b>Subtotal: {rupiah(order.total)}</b><br />Ongkir: Dikonfirmasi penjual</p>{!!order.demo && <p className="notice">Pesanan demo — tidak dihitung sebagai penjualan nyata.</p>}<label className="field">Status pesanan<Choice value={order.status} onChange={(v: string) => setOrder({ ...order, status: v })} options={['menunggu konfirmasi', 'menunggu pembayaran', 'diproses', 'dikirim', 'selesai', 'dibatalkan']} label="Status pesanan"/></label><label className="field">Status pembayaran<Choice value={order.payment} onChange={(v: string) => setOrder({ ...order, payment: v })} options={['belum dibayar', 'dibayar', 'dikembalikan']} label="Status pembayaran"/></label><label className="field">Nomor resi / keterangan pengiriman<input maxLength={150} value={order.tracking} onChange={e => setOrder({ ...order, tracking: e.target.value })}/></label><p className="demo-note">Verifikasi dana sebelum memilih Dibayar. Pembatalan mengembalikan stok satu kali.</p><button className="btn full" disabled={busy} onClick={() => save({ action: 'order', id: order.id, status: order.status, payment: order.payment, tracking: order.tracking })}>Simpan status</button></div>}</DialogContent></Dialog>
    <AlertDialog open={!!remove} onOpenChange={o => !o && setRemove('')}><AlertDialogContent><AlertDialogTitle>Hapus produk dari katalog?</AlertDialogTitle><AlertDialogDescription>Riwayat pesanan tetap tersimpan. Produk tidak lagi dapat dipesan.</AlertDialogDescription><div className="flex gap-3"><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => { save({ action: 'delete', id: remove }); setRemove(''); }}>Hapus produk</AlertDialogAction></div></AlertDialogContent></AlertDialog></main>;
}
