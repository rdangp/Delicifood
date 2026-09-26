# Delicifood — paket siap hosting

Paket ini berisi aplikasi lengkap, **build yang sudah jadi**, kode sumber, foto demo, migrasi database, dan konfigurasi untuk **Cloudflare Workers + D1 + R2 + Access**.

**Bukan file HTML statis untuk diunggah ke public_html/cPanel biasa.** Backend dibutuhkan untuk harga, stok, pesanan dan keamanan admin. Tidak ada password bawaan. Website Sites yang sebelumnya diterbitkan tetap tidak berubah.

## Yang perlu Anda siapkan

- Akun Cloudflare dan Node.js 22.13 atau lebih baru.
- D1 untuk data dan R2 untuk foto (aktivasi/biaya mengikuti ketentuan akun Cloudflare).
- Untuk admin: Cloudflare Zero Trust Access dan domain yang dapat dikonfigurasi pada akun Anda. Toko pelanggan tetap publik; hanya jalur admin yang dilindungi.
- Email pemilik yang digunakan untuk masuk melalui Access.

## Instalasi dari Windows / macOS / Linux

Ekstrak ZIP, buka terminal di folder `Delicifood-Siap-Hosting`.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm exec wrangler login
```

Jika Corepack belum tersedia, pasang pnpm versi yang tertulis pada `packageManager` di `package.json`. Perintah berikut dijalankan dari folder proyek.

## 1. Buat database dan penyimpanan foto

```sh
pnpm exec wrangler d1 create delicifood-db
pnpm exec wrangler r2 bucket create delicifood-images
```

Salin `database_id` hasil perintah pertama ke `wrangler.json`, mengganti `GANTI_DENGAN_DATABASE_ID`. Jika nama bucket atau database sudah digunakan, gunakan nama lain lalu samakan pada konfigurasi.

**Jangan memakai ID atau database milik Situs ChatGPT sebelumnya.** Paket ini memulai database baru dengan produk demo; tidak membawa data pelanggan/pesanan maupun unggahan pribadi dari situs sebelumnya.

## 2. Atur akun admin

```sh
pnpm exec wrangler secret put ADMIN_EMAIL --config wrangler.json
```

Masukkan email pemilik pada prompt. Untuk beberapa admin, pisahkan email dengan koma. Nilai tidak ditaruh di frontend atau ZIP. Jika Worker belum terbentuk, izinkan Wrangler membuat Worker bernama `delicifood` sesuai konfigurasi.

Cloudflare Zero Trust → Access → Applications → Self-hosted:

- Lindungi jalur `toko.domainanda.com/admin` beserta subjalurnya.
- Lindungi `toko.domainanda.com/api/admin` beserta subjalurnya.
- Lindungi `toko.domainanda.com/api/upload` beserta subjalurnya.
- Gunakan satu Access application dengan ketiga jalur bila antarmuka akun mendukungnya. Alternatif: aplikasi terpisah, dengan daftar AUD pada konfigurasi dipisahkan koma.
- Policy **Allow** hanya email admin. Pilih metode login yang tersedia di akun Anda, misalnya kode sekali pakai via email.
- Jangan melindungi seluruh domain jika pelanggan harus checkout tanpa akun.

Isi `vars.CF_ACCESS_TEAM_DOMAIN` pada `wrangler.json` dengan domain tim, misalnya `https://timanda.cloudflareaccess.com`, dan `vars.CF_ACCESS_AUD` dengan Application Audience (AUD) dari Access.

`worker-entry.mjs` memvalidasi signature JWT, issuer, audience, kedaluwarsa, lalu memeriksa email. Header identitas yang dikirim pengunjung dibuang. Admin ditolak ketika konfigurasi/token tidak valid. **Jangan menghapus wrapper atau mengganti main menjadi dist/server/index.js saat hosting mandiri**, karena wrapper melindungi identitas admin.

Login ChatGPT dari versi Sites tidak tersedia di hosting mandiri. Tautan masuk/keluar lama diarahkan oleh wrapper ke mekanisme Cloudflare Access.

## 3. Terapkan skema dan deploy

```sh
pnpm run db:migrate
pnpm run hosting:check
pnpm run deploy
```

`dist/` sudah disertakan sehingga tidak perlu build ulang untuk deployment pertama. Perintah `hosting:check` sengaja gagal jika placeholder belum diganti. `deploy` tidak mengisi akun atau resource secara otomatis.

Untuk domain toko sendiri, tambahkan Custom Domain pada Worker di dashboard Cloudflare, lalu gunakan domain tersebut pada konfigurasi Access. Pastikan jalur admin tetap ditolak melalui alamat alternatif Worker tanpa token Access. Untuk menghindari URL alternatif, nonaktifkan workers.dev dan preview URL setelah custom domain aktif.

## 4. Setelah kode diubah

```sh
pnpm run build
pnpm run test:hosting
pnpm run deploy
```

Jika mengubah skema, jalankan `pnpm run db:generate`, periksa migrasi baru, lalu `pnpm run db:migrate` sebelum deploy. Jangan mengubah migrasi yang sudah diterapkan. **Selalu deploy memakai wrangler.json di root, bukan dist/server/wrangler.json.** File di `dist/server` dibuat oleh framework untuk preview, bukan konfigurasi hosting mandiri.

## Preview lokal

```sh
pnpm exec wrangler d1 migrations apply DB --local --config wrangler.json
pnpm run preview:hosting
```

Preview menggunakan database lokal. Salin `.dev.vars.example` menjadi `.dev.vars` bila memerlukan nilai runtime lokal. Jangan mengunggah atau commit `.dev.vars`. Login Access tidak disimulasikan di lokal; area admin tetap ditolak tanpa token valid. Tidak ada bypass admin yang dikirim bersama paket.

## Mulai menggunakan toko

Buka `/admin` pada domain yang telah dilindungi Access, lalu login dengan email yang sama seperti `ADMIN_EMAIL`.

- Ganti produk contoh, foto, harga, spesifikasi, komposisi/alergen, dan stok per varian.
- Tanda **Demo** hanya dihapus untuk produk nyata yang telah diverifikasi.
- Unggahan JPG/PNG/WebP maksimal 5 MB; galeri hingga 6 foto.
- Checkout mereservasi stok dan menyimpan pesanan dengan status menunggu konfirmasi / belum dibayar.
- Setelah tersimpan, pelanggan mengklik tautan WhatsApp untuk mengirim detail. Aplikasi tidak memastikan pesan benar-benar terkirim.
- Konfirmasi ongkir dan pembayaran secara manual. Membuka WhatsApp tidak menandai pembayaran berhasil.
- Pembatalan mengembalikan stok satu kali; batalkan pesanan yang tidak dilanjutkan.
- Penjualan hanya menghitung subtotal pesanan nyata yang dibayar dan tidak dibatalkan, tanpa ongkir.
- Tinjau kebijakan pengiriman, retur, privasi dan ketentuan sebelum digunakan publik.

## Batasan dan hasil verifikasi

Build dan pengecekan TypeScript lulus. Tujuh tes keamanan adapter Access lulus (token valid, signature palsu, audience/issuer salah, token kedaluwarsa, konfigurasi kosong, header identitas palsu). Paket diperiksa dengan Wrangler dry-run; belum di-deploy ke akun Cloudflare Anda dan login Access nyata belum diuji. Jalankan uji checkout serta login admin pada domain Anda sebelum menerima transaksi asli.

Alur belanja versi asal sudah diuji: pencarian, pilihan varian, tambah/ubah keranjang, subtotal, reload, checkout database, dan isi tautan WhatsApp. Database menolak token pesanan ganda dan transaksi dengan stok tidak cukup.

Pembayaran online, ongkir otomatis, webhook pembayaran, refund otomatis, notifikasi WhatsApp otomatis dan kedaluwarsa reservasi otomatis belum diaktifkan. Integrasi memerlukan akun/API key dan pengujian sandbox. Untuk trafik publik, lengkapi pengendalian spam, monitoring, backup, dan pengelolaan retensi data sesuai operasi toko.

## Isi paket

- `dist/` — hasil build siap deploy.
- `worker-entry.mjs`, `hosting/` — adapter hosting dan validasi login.
- `wrangler.json` — konfigurasi akun/resource yang perlu diisi.
- `app/`, `lib/`, `components/` — kode aplikasi.
- `db/`, `drizzle/` — skema dan migrasi.
- `public/images/` — empat foto ilustrasi demo.
- `tests/` — tes adapter autentikasi.
- `.dev.vars.example` — contoh variabel lokal tanpa rahasia.
- `PANDUAN.md` — panduan fitur versi asal; bagian hosting/login digantikan BACA-DULU.md ini.
- `VERIFIKASI.md` — hasil pengujian alur versi asal.

## Referensi resmi

- Cloudflare Access JWT: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- Proteksi path: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/

Sumber/lisensi foto demo tercantum di PANDUAN.md. Tidak ada ulasan, sertifikasi, atau laporan penjualan palsu.
