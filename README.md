# CBT Online

Aplikasi Computer Based Test (CBT) untuk sekolah, madrasah, politeknik, dan universitas. Dibangun dengan Laravel, Inertia.js, React, dan Tailwind CSS, dengan dukungan render rumus LaTeX (KaTeX), unggah gambar soal, autosave jawaban, serta pengawasan anti-kecurangan.

## Fitur

- **Dua peran**: Admin/Proktor dan Peserta.
- **Manajemen ujian**: jadwal, durasi, KKM, aktif/nonaktif, pengacakan urutan soal per peserta.
- **Bank soal**: nomor soal, bobot nilai, opsi A–E, kunci jawaban, gambar soal/opsi, render LaTeX `$...$` dan `$$...$$`.
- **Manajemen peserta**: CRUD, import CSV, template CSV.
- **Ujian peserta**: login dengan nomor peserta + nama, timer server, navigasi soal, ragu-ragu, autosave via AJAX + localStorage, sinkronisasi saat koneksi pulih.
- **Anti-kecurangan**: mode fullscreen, deteksi pindah tab/blur/keluar fullscreen/shortcut, log pelanggaran, auto-submit setelah 3 pelanggaran.
- **Penilaian otomatis**: skor berbobot, status lulus/belum lulus, rekap nilai, export CSV, dan halaman cetak (bisa disimpan sebagai PDF).
- **Audit log** untuk aktivitas penting (mulai ujian, submit, reset, dsb).

## Teknologi

- PHP 8.3+ (diuji pada PHP 8.5 XAMPP)
- Laravel 13
- Inertia.js 3 + React 19 + TypeScript
- Tailwind CSS 4 + Vite 8
- MySQL 8 / MariaDB 10.4+ (diuji pada MariaDB 10.4 XAMPP)
- KaTeX + DOMPurify

## Kebutuhan

- PHP 8.3+ dengan ekstensi standar Laravel (`pdo_mysql`, `mbstring`, `openssl`, dll.)
- Composer 2
- Node.js 20+ dan npm
- MySQL/MariaDB

## Instalasi

```bash
composer install
copy .env.example .env
php artisan key:generate
```

Sesuaikan `.env`:

```env
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cbt_online
DB_USERNAME=root
DB_PASSWORD=
```

Buat database `cbt_online`, lalu:

```bash
php artisan migrate --seed
php artisan storage:link
npm install
npm run build
php artisan serve
```

Buka `http://localhost:8000`.

Untuk pengembangan frontend dengan hot reload:

```bash
npm run dev
php artisan serve
```

## Akun Demo

| Peran | Kredensial |
| --- | --- |
| Admin | `admin@cbt.test` / `password` |
| Peserta | Nomor `2026001`–`2026020`, gunakan nama sesuai data peserta (contoh `2026001` = Ahmad Fauzi) |

Data demo berisi 20 peserta dan ujian **Matematika Terintegrasi** (10 soal, 60 menit, KKM 70). Semua kunci jawaban demo adalah opsi **A**.

## Alur Singkat

1. Admin login di `/admin/login`.
2. Atur identitas lembaga di **Pengaturan**, tambah peserta, buat ujian, lalu isi bank soal.
3. Aktifkan ujian dan bagikan nomor peserta ke peserta.
4. Peserta login di `/exam/login`, mengerjakan soal, lalu submit.
5. Admin memantau sesi berjalan dan rekap nilai di **Nilai & Rekap**.

## Catatan Teknis

- **Export CSV**: tombol export menghasilkan file CSV (kompatibel dengan Excel) karena kebutuhan export `.xlsx` memerlukan dependensi tambahan (`maatwebsite/excel` atau `phpoffice/phpspreadsheet`). Halaman **Cetak** dapat digunakan untuk mencetak atau menyimpan PDF melalui dialog browser.
- **Bahasa & zona waktu**: antarmuka berbahasa Indonesia, zona waktu `Asia/Jakarta` (ubah di `config/app.php`).
- **Penyimpanan gambar**: menggunakan disk `public` (`storage/app/public/question-media`). Jalankan `php artisan storage:link` setelah clone.
- **Keamanan**: jawaban disimpan di server; timer dihitung dari `start_time` di server sehingga tidak dapat dimanipulasi dari browser. Pelanggaran tetap dicatat meskipun peserta menutup dialog.
- **Produksi**: set `APP_ENV=production` dan `APP_DEBUG=false`, jalankan `npm run build`, lalu arahkan document root web server ke folder `public`.

## Pengujian

```bash
php artisan test
```

Tes mencakup render halaman utama/admin, pembuatan ujian dan soal, login peserta, penyimpanan jawaban, submit, hasil, dan auto-submit akibat 3 pelanggaran.

## Struktur Penting

```
app/Http/Controllers/Admin   # CRUD admin, rekap, reset
app/Http/Controllers/Exam    # login peserta, workspace, jawaban, hasil
app/Services/ExamService.php # mulai ujian, penilaian, pelanggaran
app/Models                   # Exam, Question, Participant, ExamSession, dll.
resources/js/Pages           # Halaman Inertia (Admin & Exam)
resources/js/components      # UI, MathText, timer, navigator, badge koneksi
resources/js/hooks           # useAntiCheat
routes/web.php               # Seluruh rute aplikasi
```
