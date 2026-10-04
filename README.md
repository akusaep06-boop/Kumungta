# GTA SAMP Community Website

Website komunitas GTA San Andreas Multiplayer dengan fitur login, profil, chat, share modpack, dan panel admin.

## Fitur

- Login dan daftar akun (username + password)
- Edit profil (nama tampilan, bio, foto profil)
- Chat real-time (sinkron antar tab browser via localStorage)
- Share modpack dengan kategori:
  - Skin Baju
  - Hit Sound
  - Skin Senjata
  - Skin Mobil
  - Monetloader
  - Ikon Fast
  - Lainnya
- Upload foto preview untuk modpack
- Voice War (link langsung ke channel Discord)
- Panel Admin (klik logo SA)
  - Password admin: 112233
  - Hapus modpack
  - Ban / Unban akun
  - Ubah background website (warna atau foto)
- Tema hitam putih
- Responsive (Android dan PC)

## Cara Deploy di GitHub Pages

1. Buat repository baru di GitHub
2. Upload semua file di folder ini (index.html, style.css, app.js, README.md)
3. Buka Settings > Pages
4. Source: Deploy from a branch
5. Branch: main (atau master), folder: / (root)
6. Simpan, tunggu beberapa menit, lalu buka URL yang diberikan

## Catatan

- Data disimpan di localStorage browser. Setiap pengunjung memiliki data sendiri.
- Chat hanya sinkron di browser yang sama (antar tab). Untuk chat multi-user sejati dibutuhkan backend (Firebase, Supabase, dll).
- Tidak ada emoji di antarmuka sesuai permintaan.
- Admin login: klik logo SA di pojok kiri atas, lalu masukkan password 112233.

## Struktur File

- index.html - Halaman utama
- style.css - Styling hitam putih + responsive
- app.js - Logika aplikasi
- README.md - Dokumentasi
