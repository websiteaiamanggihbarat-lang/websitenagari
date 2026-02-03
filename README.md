# Website Nagari Aia Manggih Barat

Website resmi Pemerintahan Nagari Aia Manggih Barat yang dibangun dengan teknologi modern untuk menyediakan informasi dan layanan kepada masyarakat.

## 📋 Daftar Isi

- [Deskripsi Proyek](#deskripsi-proyek)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Struktur Folder](#struktur-folder)
- [Database](#database)
- [Fitur](#fitur)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Proyek](#menjalankan-proyek)
- [Struktur Routing](#struktur-routing)
- [Autentikasi](#autentikasi)
- [Deployment](#deployment)
- [Kontribusi](#kontribusi)

## 📝 Deskripsi Proyek

Website Nagari Aia Manggih Barat adalah platform digital resmi yang menyediakan berbagai informasi dan layanan untuk masyarakat Nagari Aia Manggih Barat. Website ini menampilkan profil nagari, berita terkini, galeri foto, struktur organisasi, layanan informasi, dan fitur admin untuk mengelola konten.

**Motto Pelayanan**: "RANCAK BANA" (Ramah, Amanah, Normatif, Cepat, Akurat, Kreatif, Bebas Biaya, Aman, Nyaman, Adil)

## 🛠 Teknologi yang Digunakan

### Frontend Framework
- **Next.js 16.1.1** - React framework dengan App Router untuk server-side rendering dan static site generation
- **React 19.2.3** - Library JavaScript untuk membangun user interface
- **React DOM 19.2.3** - React renderer untuk web

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework untuk styling yang cepat dan responsif
- **PostCSS** - Tool untuk mengubah CSS dengan JavaScript plugins

### Database & Backend
- **Supabase** - Backend-as-a-Service (BaaS) yang menyediakan:
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Storage
- **@supabase/supabase-js 2.90.1** - JavaScript client library untuk Supabase
- **@supabase/auth-helpers-nextjs 0.15.0** - Helper library untuk integrasi autentikasi Supabase dengan Next.js

### Analytics & SEO
- **Google Analytics** - Integrasi melalui `@next/third-parties` untuk tracking pengunjung
- **Sitemap** - Dynamic sitemap generation untuk SEO

### Development Tools
- **TypeScript 5** - Typed superset of JavaScript untuk development yang lebih aman
- **ESLint 9** - Linter untuk menjaga kualitas kode
- **eslint-config-next** - Konfigurasi ESLint khusus untuk Next.js

### Node.js Types
- **@types/node 20** - Type definitions untuk Node.js
- **@types/react 19** - Type definitions untuk React
- **@types/react-dom 19** - Type definitions untuk React DOM

## 📁 Struktur Folder

```
aiamanggihbarat/
├── app/                          # Next.js App Router directory
│   ├── admin/                    # Halaman admin (protected)
│   │   ├── page.tsx             # Dashboard admin
│   │   └── tambah-berita/       # Form tambah berita
│   │       └── page.js
│   ├── auth/                     # Route autentikasi
│   │   └── signout/
│   │       └── route.ts          # API route untuk logout
│   ├── berita/                   # Halaman berita
│   │   ├── [id]/                 # Dynamic route untuk detail berita
│   │   │   └── page.tsx
│   │   └── page.tsx              # List berita dengan pagination
│   ├── galeri/                   # Halaman galeri foto
│   │   └── page.tsx
│   ├── layanan-informasi/        # Halaman layanan informasi
│   │   └── page.tsx
│   ├── lembaga-organisasi/       # Halaman lembaga organisasi
│   │   └── page.tsx
│   ├── login/                    # Halaman login admin
│   │   └── page.tsx
│   ├── struktur-organisasi/      # Halaman struktur organisasi
│   │   └── page.tsx
│   ├── globals.css               # Global CSS styles
│   ├── layout.tsx                # Root layout component
│   ├── page.tsx                  # Homepage
│   └── sitemap.ts                # Dynamic sitemap generator
│
├── components/                    # Reusable React components
│   ├── AnimateOnScroll.tsx       # Component untuk animasi scroll
│   ├── ConditionalLayout.tsx    # Layout conditional (dengan/tanpa nav & footer)
│   ├── Footer.tsx                # Footer component
│   ├── Navigation.tsx            # Navigation/Header component
│   ├── PetaNagari.tsx            # Component peta nagari
│   ├── ScrollAnimation.tsx       # Utility untuk scroll animation
│   └── ScrollAnimations.tsx     # Scroll animations provider
│
├── hooks/                         # Custom React hooks
│   └── useScrollAnimation.ts     # Hook untuk scroll animation
│
├── lib/                           # Utility libraries
│   └── supabase.ts               # Supabase client configuration
│
├── public/                        # Static assets
│   ├── image/                    # Folder gambar
│   │   ├── galeri/               # Foto galeri (galeri1-10.jpeg)
│   │   ├── keluarga-besar-nagari.jpeg
│   │   ├── logo-kkn.png
│   │   ├── map-nagari.jpeg
│   │   ├── peta-nagari.jpeg
│   │   └── struktur-nagari.png
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── middleware.ts                  # Next.js middleware untuk route protection
├── next.config.ts                 # Next.js configuration
├── postcss.config.mjs             # PostCSS configuration
├── tsconfig.json                  # TypeScript configuration
├── eslint.config.mjs              # ESLint configuration
├── package.json                   # Dependencies dan scripts
├── package-lock.json              # Lock file untuk dependencies
├── .gitignore                     # Git ignore rules
└── .env.local                     # Environment variables (tidak di-commit)
```

## 🗄 Database

Proyek ini menggunakan **Supabase** sebagai database dan backend service. Supabase menyediakan PostgreSQL database yang dikelola secara cloud.

### Struktur Database

Berdasarkan kode yang ada, database memiliki tabel berikut:

#### Tabel `berita`
Tabel untuk menyimpan berita nagari dengan struktur:
- `id` (Primary Key) - ID unik berita
- `judul` (String) - Judul berita
- `konten` (Text) - Isi/konten berita
- `foto_url` (String, nullable) - URL foto berita
- `created_at` (Timestamp, nullable) - Waktu pembuatan berita

### Konfigurasi Database

Database dikonfigurasi melalui file `lib/supabase.ts` yang menggunakan environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - URL Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous/public key untuk Supabase

### Authentication

Supabase Authentication digunakan untuk:
- Login admin melalui halaman `/login`
- Proteksi route `/admin/*` melalui middleware
- Session management dengan cookies

## ✨ Fitur

### Fitur Publik
1. **Homepage** - Halaman utama dengan hero section, visi-misi, dan profil nagari
2. **Profil Nagari** - Informasi lengkap tentang nagari termasuk:
   - Sejarah nagari
   - Visi & Misi
   - Batas wilayah
   - Jorong dan kampung
   - Informasi penduduk
   - Sarana pendidikan
   - Kehidupan sosial keagamaan
   - Kesehatan
   - Kesenian tradisional
   - Kelompok tani
3. **Berita** - Halaman berita dengan:
   - List berita dengan pagination (6 berita per halaman)
   - Detail berita individual
   - Dynamic routing untuk setiap berita
4. **Galeri** - Galeri foto nagari
5. **Struktur Organisasi** - Struktur organisasi pemerintahan nagari
6. **Lembaga Organisasi** - Informasi lembaga organisasi
7. **Layanan Informasi** - Informasi layanan yang tersedia
8. **Peta Nagari** - Peta lokasi nagari

### Fitur Admin
1. **Dashboard Admin** (`/admin`) - Halaman utama admin panel
2. **Kelola Berita** (`/admin/tambah-berita`) - Form untuk menambah berita baru
3. **Autentikasi** - Login/logout dengan proteksi session
4. **Route Protection** - Middleware untuk melindungi route admin

### Fitur Teknis
1. **SEO Optimization**:
   - Dynamic sitemap generation
   - Metadata optimization
   - Google Search Console verification
2. **Analytics**:
   - Google Analytics integration
3. **Responsive Design**:
   - Mobile-first approach dengan Tailwind CSS
   - Breakpoints untuk berbagai ukuran layar
4. **Animations**:
   - Scroll animations untuk elemen
   - Smooth transitions dan hover effects
5. **Performance**:
   - Server-side rendering (SSR)
   - Dynamic rendering untuk data real-time
   - Optimized images dan assets

## 💻 Persyaratan Sistem

- **Node.js** 18.x atau lebih tinggi
- **npm** atau **yarn** atau **pnpm** atau **bun**
- **Akun Supabase** dengan project yang sudah dikonfigurasi
- **Git** (opsional, untuk version control)

## 🚀 Instalasi

1. **Clone repository** (jika menggunakan Git):
```bash
git clone <repository-url>
cd aiamanggihbarat
```

2. **Install dependencies**:
```bash
npm install
# atau
yarn install
# atau
pnpm install
```

3. **Setup environment variables**:
Buat file `.env.local` di root directory dengan konten berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Setup Supabase Database**:
   - Buat project di [Supabase](https://supabase.com)
   - Buat tabel `berita` dengan struktur:
     ```sql
     CREATE TABLE berita (
       id SERIAL PRIMARY KEY,
       judul TEXT NOT NULL,
       konten TEXT NOT NULL,
       foto_url TEXT,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     ```
   - Setup Row Level Security (RLS) policies sesuai kebutuhan
   - Setup Authentication jika diperlukan untuk admin

## ⚙️ Konfigurasi

### Environment Variables

File `.env.local` harus berisi:
- `NEXT_PUBLIC_SUPABASE_URL` - URL Supabase project Anda
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous key dari Supabase project

### Next.js Configuration

File `next.config.ts` dapat dikonfigurasi untuk:
- Image domains
- Redirects
- Headers
- Environment variables tambahan

### TypeScript Configuration

File `tsconfig.json` mengkonfigurasi:
- Path aliases (`@/*` untuk root directory)
- Compiler options
- Module resolution

## 🏃 Menjalankan Proyek

### Development Mode
```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Production Build
```bash
npm run build
npm start
# atau
yarn build
yarn start
```

### Linting
```bash
npm run lint
# atau
yarn lint
```

## 🗺 Struktur Routing

Proyek menggunakan Next.js App Router dengan struktur berikut:

### Public Routes
- `/` - Homepage
- `/berita` - List berita (dengan pagination)
- `/berita/[id]` - Detail berita
- `/galeri` - Galeri foto
- `/struktur-organisasi` - Struktur organisasi
- `/lembaga-organisasi` - Lembaga organisasi
- `/layanan-informasi` - Layanan informasi

### Protected Routes (Admin)
- `/admin` - Dashboard admin (protected)
- `/admin/tambah-berita` - Form tambah berita (protected)
- `/login` - Halaman login

### API Routes
- `/auth/signout` - API route untuk logout

## 🔐 Autentikasi

### Flow Autentikasi

1. **Login**: User mengakses `/login` dan login dengan kredensial Supabase
2. **Session Check**: Middleware memeriksa session di setiap request ke `/admin/*`
3. **Redirect**: Jika tidak ada session, redirect ke `/login`
4. **Logout**: User logout melalui `/auth/signout` route

### Middleware Protection

File `middleware.ts` mengimplementasikan:
- Proteksi semua route `/admin/*`
- Redirect ke `/login` jika tidak authenticated
- Redirect dari `/login` ke `/admin` jika sudah authenticated
- Session management dengan Supabase Auth Helpers

### Supabase Auth Configuration

Autentikasi menggunakan:
- `@supabase/auth-helpers-nextjs` untuk server-side auth
- Cookie-based session management
- Server Client untuk session checking

## 📦 Deployment

### Vercel (Recommended)

1. Push code ke Git repository (GitHub, GitLab, atau Bitbucket)
2. Import project di [Vercel](https://vercel.com)
3. Tambahkan environment variables di Vercel dashboard
4. Deploy

### Environment Variables untuk Production

Pastikan untuk menambahkan environment variables berikut di platform deployment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Build Configuration

Proyek ini siap untuk deployment dengan:
- Automatic builds pada push ke main branch
- Preview deployments untuk pull requests
- Optimized production builds

## 📝 Catatan Penting

1. **Environment Variables**: Jangan commit file `.env.local` ke repository
2. **Supabase Security**: Pastikan RLS (Row Level Security) policies sudah dikonfigurasi dengan benar
3. **Image Storage**: Foto berita disimpan sebagai URL (dapat menggunakan Supabase Storage atau external storage)
4. **SEO**: Sitemap di-generate secara dinamis dan termasuk semua berita
5. **Analytics**: Google Analytics tracking ID sudah dikonfigurasi di `layout.tsx`

## 🤝 Kontribusi

Untuk berkontribusi pada proyek ini:

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

Proyek ini adalah website resmi Pemerintahan Nagari Aia Manggih Barat.

## 📞 Kontak

Untuk pertanyaan atau informasi lebih lanjut tentang website ini, silakan hubungi Pemerintahan Nagari Aia Manggih Barat.

---

**Dibuat dengan ❤️ untuk Nagari Aia Manggih Barat**
