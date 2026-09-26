# Delicifood — panduan proyek

## Stack dan struktur
React 19 + TypeScript dengan Vinext, server Cloudflare Worker, database D1 (SQLite), penyimpanan foto R2. Komponen dialog, tabs, select, table, checkbox, dan konfirmasi memakai Shadcn/Radix. Autentikasi admin menggunakan Sign in with ChatGPT dari platform, ditambah allowlist email di server.

- `app/storefront.tsx`: pengalaman pelanggan dan keranjang.
- `app/produk/[slug]`: URL produk dan metadata.
- `app/admin`: halaman pemilik terlindungi di server.
- `app/api/shop`: katalog publik, tanpa data pelanggan.
- `app/api/orders`: checkout dan WhatsApp.
- `app/api/admin`: data pelanggan, CRUD, pengaturan; setiap metode memeriksa otorisasi.
- `app/api/upload`: unggahan foto admin; batas 5 MB dan pemeriksaan signature JPG/PNG/WebP.
- `app/api/images`: foto produk publik dari R2.
- `db/schema.ts`, `drizzle/`: skema dan migrasi.
- `lib/shop.ts`: produk dan pengaturan awal; hanya disemai sekali.

## Jalankan lokal
Gunakan Node >=22.13 dan pnpm sesuai packageManager pada package.json.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run db:generate
pnpm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_complete_speed.sql
pnpm dev
```

Ikuti README.md starter untuk perbedaan preview lokal dan build. Pada lingkungan Sites managed, gunakan workflow Sites untuk build dan `sites-preview start` untuk preview internal. Jangan menjalankan migrasi yang sama dua kali. Local D1/R2 terpisah dari produksi. Pada lokal, tidak ada simulasi masuk admin; jangan menambahkan bypass autentikasi ke build produksi. Preview checkout menggunakan data demo.

## Environment dan deployment
`ADMIN_EMAIL` adalah daftar email admin dipisahkan koma, disimpan server-side melalui pengaturan runtime Sites. Nilai kosong menolak seluruh akses admin. Gunakan akun pemilik yang sama saat Sign in with ChatGPT. Tidak ada password frontend.

Manifest `.openai/hosting.json` memakai binding D1 `DB` dan R2 `BUCKET`. Migrasi SQL disimpan bersama source dan diterapkan platform sebelum Worker diterbitkan. Pengaturan runtime tidak dimasukkan ke Git. Perubahan environment perlu deployment berikutnya untuk diterapkan.

Untuk deployment Sites: buka proyek yang sama, jalankan build dan workflow sumber Sites, push commit, simpan versi dengan archive hasil build, deploy versi tersebut, dan periksa status sampai succeeded. Jangan membuat proyek baru untuk update. Situs diterbitkan privat untuk ditinjau pemilik. Berubah menjadi publik memerlukan pengaturan akses publik yang disengaja. Autentikasi admin tetap berlaku saat toko publik.

## Menggunakan admin
Buka `/admin` dan masuk dengan akun ChatGPT pemilik. Email harus terdaftar di ADMIN_EMAIL.

1. **Produk:** tambah/edit nama, URL, kategori, deskripsi, spesifikasi, berat, foto, galeri, unggulan, dan varian. Set harga dan stok per varian. Unggah gambar JPG/PNG/WebP maksimal 5 MB. Optimalkan foto sekitar 1200 px dan <500 KB sebelum mengunggah.
2. **Demo:** produk awal dan foto adalah ilustrasi. Ganti informasi dengan data nyata, termasuk komposisi, alergen, daya simpan, ukuran, serta foto aktual. Matikan tanda Demo hanya setelah diverifikasi. Produk yang dihapus disembunyikan; riwayat pesanan tetap ada.
3. **Pesanan:** checkout menyimpan nama, WhatsApp, alamat, catatan, snapshot harga/varian dan subtotal. Stok langsung direservasi. Pesanan tidak terkonfirmasi otomatis.
4. **WhatsApp:** pelanggan klik tautan setelah pesanan tersimpan. Aplikasi tidak mengetahui apakah pesan benar-benar dikirim. Penjual mengonfirmasi ongkir, stok, dan pembayaran lewat WhatsApp.
5. **Status:** pembayaran (belum dibayar/dibayar/dikembalikan) terpisah dari pemenuhan (menunggu konfirmasi/menunggu pembayaran/diproses/dikirim/selesai/dibatalkan). Tandai dibayar setelah memverifikasi dana. Isi resi saat dikirim. Pembatalan mengembalikan stok sekali dan tidak dapat dibuka lagi; buat pesanan baru jika diperlukan. Refund merupakan proses manual, tidak memindahkan dana otomatis.
6. **Laporan:** penjualan = subtotal produk dari seluruh pesanan non-demo yang dibayar, selain dibatalkan. Ongkir tidak dihitung. Daftar detail menampilkan 500 pesanan terbaru.
7. **Pengaturan:** identitas, banner, kontak, tentang toko, dan kebijakan. Kebijakan awal perlu ditinjau pemilik, termasuk masa retensi data, pengiriman, dan retur makanan.

## Fitur berfungsi
Katalog database; pencarian nama; filter kategori, harga awal produk, dan stok; sort; detail/galeri/varian; keranjang localStorage; checkout tanpa akun pelanggan (akses privat situs saat peninjauan tetap memerlukan masuk platform); subtotal; validasi harga dan stok server; pesanan idempoten; WhatsApp; admin dengan otorisasi; CRUD; upload; status/resi; pengaturan dan laporan non-demo.

Nilai produk pada katalog/filter adalah harga varian termurah. Detail dan checkout memakai harga varian yang dipilih. Keranjang menyimpan ID varian dan jumlah saja; harga dibaca ulang dari database. Stok database memiliki CHECK >=0; penyimpanan order dan pengurangan stok dilakukan dalam batch transaksi. Token unik checkout mencegah duplikasi permintaan/retry. Token retry disimpan di perangkat tanpa identitas pelanggan; rincian pribadi tidak ditulis ke localStorage.

## Integrasi yang belum diaktifkan
- Pembayaran online: belum ada provider, API key, webhook, atau biaya gateway. Hubungkan adapter server dengan penyedia yang dipilih. Mulai sandbox, validasi signature callback, nominal dan mata uang; gunakan event ID unik. Hanya webhook terverifikasi boleh mengubah pembayaran otomatis.
- Ongkir otomatis: memerlukan akun/API kurir atau agregator dan alamat asal lengkap. Isi berat serta tujuan, panggil quote server, simpan hasil quote dan masa berlaku. Saat ini ongkir selalu “Dikonfirmasi oleh penjual”, bukan Rp 0.
- Tidak ada notifikasi WhatsApp otomatis, refund otomatis, pelacakan kurir otomatis, atau jaminan pesan terkirim.
- Reservasi pesanan belum memiliki kedaluwarsa otomatis. Pemilik perlu membatalkan pesanan yang tidak dilanjutkan. Sebelum trafik publik tinggi, tambahkan pembatasan laju/anti-bot, kebijakan retensi/penghapusan data, monitoring, dan backup sesuai kebutuhan operasional.

## Sumber foto demo
Foto diunduh dari Unsplash dengan Unsplash License (https://unsplash.com/license):
- Cookies: Karina Kungla — https://unsplash.com/photos/chocolate-chip-cookies-and-a-glass-of-milk-P0gLx7l2-CE
- Brownies: Michelle Tsang — https://unsplash.com/photos/baked-brownies-1rqk6XVnw44
- Crochet bag: Colton Sturgeon — https://unsplash.com/photos/a-pink-and-white-crocheted-bag-sitting-on-a-wooden-floor-uCLB3X5cpd0
- Bracelet: sacred tibet — https://unsplash.com/photos/a-colorful-bead-bracelet-adorns-a-wrist-9Xb-WMT0A4E
