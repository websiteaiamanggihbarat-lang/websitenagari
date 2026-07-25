# 📚 Laporan Analisis & Dokumentasi Lengkap Website Nagari Aia Manggih Barat

Dokumen ini berisi rangkuman komprehensif mengenai **Website Nagari Aia Manggih Barat**, mencakup arsitektur teknis, desain visual, sistem basis data, seluruh fitur publik & admin, serta mekanisme keamanan dan animasi.

---

## 📌 1. Ringkasan & Latar Belakang Proyek

- **Nama Proyek**: Website Nagari Aia Manggih Barat (`aiamanggihbarat`)
- **Tujuan**: Platform digital resmi Pemerintahan Nagari Aia Manggih Barat (Kecamatan Lubuk Sikaping, Kabupaten Pasaman, Sumatera Barat) untuk menyajikan informasi publik (sejarah, demografi, sarana pendidikan, lembaga masyarakat, layanan administrasi, berita, galeri) serta menyediakan panel administrator (CMS) untuk pengelolaan data secara dinamis.
- **Motto Pelayanan**: **"RANCAK BANA"** (*Ramah, Amanah, Normatif, Cepat, Akurat, Kreatif, Bebas Biaya, Aman, Nyaman, dan Adil*).
- **Sejarah Nagari**: Berawal dari pemekaran Nagari Induk Aia Manggih berdasarkan Peraturan Bupati Pasaman No. 21 Tahun 2017. Menjadi nagari persiapan pada 2017, kemudian resmi menjadi nagari definitif pada September 2022. Wali Nagari definitif pertama (Afdel Haq, S.Pd.I.) dilantik pada 26 Desember 2022.

---

## 🛠 2. Arsitektur Teknis & Tech Stack

### Frontend & Framework
- **Framework Utama**: [Next.js 16.1.1](https://nextjs.org/) (App Router)
- **UI Library**: [React 19.2.3](https://react.dev/) & React DOM 19.2.3
- **Bahasa Pemrograman**: [TypeScript 5](https://www.typescriptlang.org/) & JavaScript (ES6+)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) dengan PostCSS, ditambah CSS Variables & Keyframe Animations khusus pada `app/globals.css`
- **Analytics & SEO**: `@next/third-parties` (Google Analytics) & Dynamic Sitemap Generator (`app/sitemap.ts`)

### Backend, Database & Storage
- **Backend-as-a-Service (BaaS)**: [Supabase](https://supabase.com/) (PostgreSQL Database, Authentication, Real-time API, & File Storage)
- **Supabase Libraries**:
  - `@supabase/supabase-js` (v2.90.1)
  - `@supabase/ssr` (v0.12.3)
  - `@supabase/auth-helpers-nextjs` (v0.15.0)
- **Storage Bucket**: Bucket Supabase Storage `foto-berita` untuk mengunggah gambar berita dan sarana pendidikan.

---

## 🎨 3. Desain Visual, Warna & Sistem Animasi

### Palet Warna (Brand & Neutral Palette)
Website ini mengusung tema warna khas budaya Minangkabau yang elegan, hangat, dan berwibawa:
- **Warna Utama (Mahogany/Cokelat Tua)**:
  - `--primary-main`: `#2c1b01`
  - `--primary-main-dark`: `#1a1200`
  - `--primary-main-soft`: `#5a3b0d`
- **Warna Aksen (Emas Krem/Batu Cadas)**:
  - `--secondary-cream`: `#b6a587`
  - `--secondary-cream-light`: `#e6ddcf`
  - Background Aksesori: `#f0e8db`, `#f7f2e8`
- **Warna Netral & Kaca**:
  - Background bersih (`#ffffff`), Slate Gray (`#f8fafc` s/d `#0f172a`), serta efek *Glassmorphism* (`backdrop-blur-md bg-white/85`).

### Tipografi & Tata Letak
- Font standar modern: `"Helvetica Neue", Helvetica, Arial, sans-serif` dengan pengaturan `-webkit-font-smoothing` dan `font-feature-settings: "kern" 1`.
- Mobile-first responsive grid dengan paduan padding yang adaptif (`px-6 lg:px-8`).

### Sistem Animasi Scroll (Interaktivitas)
Diimplementasikan secara khusus menggunakan React Hook `useScrollAnimation` dan Provider `ScrollAnimations.tsx`:
- **Kelas Animasi Scroll**:
  - `.scroll-slide-left`: Elemen muncul dari arah kiri.
  - `.scroll-slide-right`: Elemen muncul dari arah kanan.
  - `.scroll-slide-bottom`: Elemen muncul dari bawah ke atas.
  - `.scroll-fade`: Transisi *fade-in*.
  - `.scroll-scale`: Transisi efek pembesaran (*scaling*).
- **Mekanisme Fallback (CSS `@supports`)**: Jika JavaScript mati atau `IntersectionObserver` terlambat, CSS fallback `@keyframes fadeInFallback` menjamin konten tetap tampil tanpa menghalangi pembaca.

---

## 🗄 4. Struktur Database & Model Data (Supabase)

Proyek ini terintegrasi dengan tabel-tabel utama di Supabase PostgreSQL:

1. `berita`:
   - `id` (Primary Key)
   - `judul` (String)
   - `konten` (Text)
   - `foto_url` (String, nullable)
   - `created_at` (Timestamp)
   - `status_publikasi` (String/Boolean)
   - `views` (Integer)
2. `informasi_penduduk`:
   - `id` (Primary Key)
   - `tanggal_data` (Date)
   - `sumber_data` (String)
   - `jumlah_penduduk` (Integer)
   - `jumlah_laki_laki` (Integer)
   - `jumlah_perempuan` (Integer)
   - `jumlah_kk` (Integer)
   - `status_publikasi` (String / active)
   - `keterangan` (Text)
3. `kelompok_usia_penduduk`:
   - `id` (Primary Key)
   - `informasi_penduduk_id` (Foreign Key ke `informasi_penduduk`)
   - `nama_kelompok` (String, e.g. "0–6 Tahun", "7–18 Tahun", dst.)
   - `rentang_usia` (String)
   - `jumlah` (Integer)
   - `urutan` (Integer)
4. `pendataan_sarana_pendidikan`:
   - `id` (Primary Key)
   - `tahun_pendataan` (Integer)
   - `sumber_data` (String)
   - `updated_at` (Timestamp)
5. `sarana_pendidikan`:
   - `id` (Primary Key)
   - `pendataan_id` (Foreign Key)
   - `nama_sarana` (String)
   - `tingkat_pendidikan` (PAUD, TK, SD, SMP, SMA, SMK, SLB, Lainnya)
   - `jenis_pengelolaan` (Negeri / Swasta)
   - `alamat` (String)
   - `jumlah_siswa` (Integer)
   - `jumlah_guru` (Integer)
   - `status_operasional` (aktif, tidak_aktif, dalam_pembangunan)
   - `foto_url` (String, nullable)

---

## 🚀 5. Rincian Fitur Utama Aplikasi

### A. Fitur Publik (User-Facing Pages)

1. **Beranda (`/` - `app/page.tsx`)**:
   - **Hero Banner**: Foto *Keluarga Besar Nagari*, judul besar, dan motto "RANCAK BANA".
   - **Visi & Misi Pelayanan**: Penjelasan transparansi & standar pelayanan nagari.
   - **Peta Interaktif (`PetaNagari.tsx`)**: Menggunakan Leaflet Map dengan penanda lokasi koordinat nagari, Jorong Padang Sarai, dan Jorong Kampung Padang Paraman Dareh.
   - **Profil & Sejarah Nagari**: Narasi sejarah pembentukan nagari dari musyawarah 2016 hingga kepemimpinan Wali Nagari Afdel Haq.
   - **Informasi Penduduk Dinamis (`InformasiPendudukDinamis.tsx`)**: Mengambil data kependudukan terbaru dari Supabase. Dilengkapi **Fallback Data 2023** (3.199 jiwa, 1.592 L, 1.613 P, 969 KK) apabila koneksi Supabase gagal.
   - **Sarana Pendidikan Dinamis (`SaranaPendidikanDinamis.tsx`)**: Menampilkan statistik sekolah, jumlah siswa, jumlah guru, filter per tingkat pendidikan, serta peta/foto masing-masing sekolah.
   - **Sarana Pendukung Lain**: Keagamaan (masjid/musholla), Kesehatan (Puskesmas/Poskesri), Kesenian Tradisional, dan Kelompok Tani.

2. **Struktur Organisasi (`/struktur-organisasi`)**:
   - Bagan visual struktur pemerintahan nagari (`/image/struktur-nagari.png`).
   - Rincian jajaran kepemimpinan: Wali Nagari, Sekretaris Nagari, Kaur Keuangan, Kaur Umum, Kasi Pemerintahan, Kasi Kesejahteraan/Pelayanan, Kepala Jorong Padang Sarai, dan Kepala Jorong Kampung Padang Paraman Dareh.

3. **Lembaga & Organisasi Nagari (`/lembaga-organisasi`)**:
   - Halaman detail untuk 6 lembaga kemasyarakatan utama:
     - **BAMUS** (Badan Musyawarah Nagari - Ketua: Noviar)
     - **PKK** (Pemberdayaan Kesejahteraan Keluarga - Ketua: Ny. Netri Afdel Haq)
     - **Karang Taruna** (Kurenah Aia Manggih Barat - Ketua: Randi Laksamana)
     - **KAN** (Kerapatan Adat Nagari - Ketua: Syahril Dt. Bagindo)
     - **LPMN** (Lembaga Pemberdayaan Masyarakat Nagari - Ketua: H. Kasman)
     - **LINMAS** (Perlindungan Masyarakat)

4. **Layanan Informasi (`/layanan-informasi`)**:
   - Katalog 15+ jenis layanan administrasi nagari (SK Miskin, SK Kurang Mampu, Surat Nikah NA, Surat Tanah, Surat Domisili, SK Usaha, SK Ahli Waris, Surat Pengantar IMB, SK Meninggal, dll.).
   - Dilengkapi tabel transparansi memuat: *Nama Layanan*, *Syarat Dokumen*, *Estimasi Waktu* (20-30 menit atau 2 hari), *Biaya (Semua GRATIS)*, dan *Sifat Pelayanan*.

5. **Berita Nagari (`/berita` & `/berita/[id]`)**:
   - Halaman utama daftar berita dengan *pagination* (6 berita per halaman).
   - Pengambilan data langsung dari Supabase (`dynamic = 'force-dynamic'`, `noStore()`).
   - Halaman detail artikel berita lengkap dengan gambar header, isi berita, tanggal terbit, dan penghitung pembaca.

6. **Galeri Nagari (`/galeri`)**:
   - Grid album foto kegiatan nagari (`galeri1.jpeg` s/d `galeri10.jpeg`).
   - *Interactive Modal Lightbox*: Mengklik foto akan membuka tampilan *fullscreen* dengan efek backdrop blur, penutupan via tombol ESC, dan penguncian scroll latar belakang.

---

### B. Fitur Admin & Keamanan (Admin Panel)

1. **Autentikasi & Login (`/login`)**:
   - Menggunakan Next.js Server Action (`loginAction`).
   - Melakukan autentikasi email & password menggunakan Supabase Auth `signInWithPassword`.
   - Mengarahkan kembali pengguna ke halaman asal (`redirectedFrom`) setelah login berhasil.

2. **Route Protection (`middleware.ts`)**:
   - Melindungi seluruh alur `/admin/*` menggunakan Next.js Middleware.
   - Memeriksa kevalidan token sesi Supabase (`access_token`).
   - Memblokir akses tanpa sesi dan mengarahkan paksa pengguna ke `/login`.

3. **Mekanisme Logout Aman (`/auth/signout/route.ts`)**:
   - Menghentikan sesi autentikasi Supabase.
   - Menghapus secara eksplisit seluruh cookie autentikasi (`sb-access-token`, `sb-refresh-token`, cookie `sb-*`) di berbagai path dan domain untuk mencegah pembacaan ulang oleh browser.

4. **Dashboard Admin (`/admin`)**:
   - Pusat navigasi pengelola dengan antarmuka berbasis kartu (*card interface*):
     - **Kelola Berita (`/admin/tambah-berita`)**: Form input berita, unggah gambar ke Supabase Storage, edit, hapus, dan publikasi.
     - **Kelola Informasi Penduduk (`/admin/informasi-penduduk`)**: Pengelolaan data jumlah penduduk, KK, jenis kelamin, serta distribusi rentang usia.
     - **Kelola Sarana Pendidikan (`/admin/sarana-pendidikan`)**: Pengelolaan statistik pendidikan, daftar sekolah, fasilitas, lokasi, dan status keaktifan.

---

## 📁 6. Peta Struktur Folder & File Proyek

```
aiamanggihbarat/
├── app/                              # Next.js App Router
│   ├── admin/                        # Panel Administrasi (Protected)
│   │   ├── informasi-penduduk/       # Kelola data demografi & usia
│   │   │   └── page.js
│   │   ├── sarana-pendidikan/        # Kelola data sekolah & statistik
│   │   │   └── page.js
│   │   ├── tambah-berita/            # Form tambah & edit berita + upload foto
│   │   │   └── page.js
│   │   └── page.tsx                  # Dashboard Admin
│   ├── auth/                         # Handler autentikasi
│   │   └── signout/
│   │       └── route.ts              # API Route untuk proses Sign Out & clear cookies
│   ├── berita/                       # Halaman Berita Publik
│   │   ├── [id]/                     # Detail berita (Dynamic Route)
│   │   │   └── page.tsx
│   │   └── page.tsx                  # List Berita & Pagination
│   ├── galeri/                       # Halaman Galeri Foto Lightbox
│   │   └── page.tsx
│   ├── layanan-informasi/            # Katalog Layanan Publik & Syarat Administrasi
│   │   └── page.tsx
│   ├── lembaga-organisasi/           # Informasi Lembaga Kemasyarakatan (BAMUS, PKK, dll)
│   │   └── page.tsx
│   ├── login/                        # Halaman Login Admin (Server Action)
│   │   └── page.tsx
│   ├── struktur-organisasi/          # Halaman Bagan Organisasi & Aparatur
│   │   └── page.tsx
│   ├── globals.css                   # Theme CSS, Variables, Animations & Fallback Rules
│   ├── layout.tsx                    # Root Layout + Metadata SEO + Provider
│   ├── page.tsx                      # Beranda (Hero, Visi-Misi, Profil, Map, Data Dinamis)
│   └── sitemap.ts                    # Dynamic Sitemap Generator untuk SEO
│
├── components/                       # Komponen Reusable
│   ├── AnimateOnScroll.tsx           # Wrapper elemen animasi scroll
│   ├── ConditionalLayout.tsx        # Layout kondisional (Nav & Footer toggle)
│   ├── Footer.tsx                    # Footer global dengan link & alamat kantor
│   ├── InformasiPendudukDinamis.tsx  # Komponen data penduduk dari Supabase / Backup
│   ├── Navigation.tsx                # Header Navigation + Mobile Sidebar Drawer
│   ├── PetaNagari.tsx                # Komponen Peta Interaktif Leaflet Map
│   ├── SaranaPendidikanDinamis.tsx   # Komponen data pendidikan & sekolah
│   ├── ScrollAnimation.tsx           # Utilitas animasi scroll tunggal
│   └── ScrollAnimations.tsx         # Scroll Animations Provider (Global Observer)
│
├── hooks/                            # Custom React Hooks
│   └── useScrollAnimation.ts         # Hook penangan IntersectionObserver animasi scroll
│
├── lib/                              # Utility Libraries
│   └── supabase.ts                   # Inisialisasi Supabase Browser Client
│
├── public/                           # Asset Statis (Gambar, Icon, Logo)
│   ├── image/
│   │   ├── galeri/                   # Foto galeri (galeri1.jpeg - galeri10.jpeg)
│   │   ├── keluarga-besar-nagari.jpeg# Banner Hero utama
│   │   ├── logo-kkn.png              # Logo Nagari / KKN
│   │   ├── map-nagari.jpeg           # Peta statis
│   │   ├── peta-nagari.jpeg          # Banner peta
│   │   └── struktur-nagari.png       # Bagan Struktur Organisasi
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   └── vercel.svg
│
├── middleware.ts                     # Next.js Middleware untuk Proteksi Route /admin
├── next.config.ts                    # Konfigurasi Next.js
├── postcss.config.mjs                # Konfigurasi PostCSS
├── tsconfig.json                     # Konfigurasi TypeScript
├── eslint.config.mjs                 # Konfigurasi ESLint
├── package.json                      # Depedensi & Script npm
└── README.md                         # Dokumentasi Awal Proyek
```

---

## 🎯 7. Kesimpulan & Nilai Tambah Proyek

Website Nagari Aia Manggih Barat dibangun dengan standar web modern yang tidak hanya mengedepankan keindahan estetika (*glassmorphism*, skema warna elegan Minangkabau, dan animasi *smooth scroll*), namun juga memiliki arsitektur backend yang kokoh:
1. **Keamanan Data**: Menggunakan Supabase Auth dan middleware Next.js untuk menjaga keamanan area admin.
2. **Ketersediaan Layanan High-Availability**: Komponen publik penting seperti data kependudukan dilengkapi dengan *data fallback*, sehingga website tetap dapat menampilkan informasi akurat meskipun koneksi database sedang mengalami kendala.
3. **Ramah SEO & Aksesibilitas**: Dilengkapi dengan dynamic sitemap, struktur HTML5 semantik, serta fokus visual (*focus-visible*) yang baik untuk aksesibilitas.
