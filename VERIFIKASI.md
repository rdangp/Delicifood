# Verifikasi Delicifood

Pemeriksaan pada preview internal dengan database lokal, 25 September 2026.

- TypeScript `tsc --noEmit`: lulus.
- Build Worker Vinext: lulus; build akhir dilakukan sebelum deployment.
- Katalog memuat empat produk demo beserta foto lokal.
- Pencarian `cookies`: katalog menyisakan Chocolate Chip Cookies.
- Menambah tanpa varian: ditolak dengan pesan “Pilih varian terlebih dahulu”.
- Varian Original 6 pcs, dua item: Rp 70.000. Perubahan menjadi tiga: Rp 105.000.
- Reload halaman: keranjang tiga item dipertahankan.
- Checkout lokal dengan data pelanggan dummy: order tersimpan, status menunggu konfirmasi, belum dibayar.
- Tautan WhatsApp: tujuan 6281246311600, nama/varian/jumlah/subtotal/catatan/alamat lengkap, penanda demo, ongkir dikonfirmasi. Tidak mengirim pesan pengujian ke toko.
- Admin anonim: diarahkan ke `/signin-with-chatgpt?return_to=%2Fadmin`. Halaman masuk tersebut dimiliki platform dan tidak berjalan di preview lokal. Sesi login pemilik belum diuji end-to-end di produksi.
- Uji SQLite terhadap skema migrasi dan SQL checkout: token duplikat ditolak; stok tidak cukup membatalkan transaksi; stock tetap nonnegatif; status pembayaran terpisah.
- Pemeriksaan source: API admin dan upload memeriksa autentikasi+allowlist server; perubahan memeriksa Origin; data pelanggan hanya keluar di endpoint admin terotorisasi; upload memeriksa ukuran, MIME dan signature.
- Layout desktop diperiksa secara visual; breakpoint mobile dan tablet diterapkan. Emulasi perangkat mobile tidak tersedia melalui API preview yang digunakan.
- Pencarian WebMCP diimplementasikan dengan feature detection; verifikasi runtime tidak tersedia karena modelContext tidak didukung preview ini. Fitur pencarian biasa tetap berfungsi.

Belum diuji dengan akun/provider nyata: pembayaran gateway, tarif ongkir, webhook, refund otomatis, dan pengiriman pesan WhatsApp. Semua integrasi tersebut belum diaktifkan.
