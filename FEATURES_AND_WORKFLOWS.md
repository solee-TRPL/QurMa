# QurMa - Role Features, Logic & Workflows

Dokumen ini menjelaskan daftar fitur, logika inti, dan alur kerja (workflow) untuk masing-masing role di sistem QurMa, dengan fokus utama pada role **Teacher (Guru)**.

---

## 1. Role: TEACHER (GURU)
Guru memiliki tanggung jawab utama dalam mengelola kegiatan akademik harian santri, khususnya terkait setoran hafalan dan target capaian.

### 📋 Daftar Fitur (Views)
1. **Input Hafalan (`InputHafalan.tsx`)**: Halaman utama untuk memasukkan setoran harian santri (Sabaq, Sabqi, Manzil).
2. **Target Pekanan (`WeeklyTarget.tsx`)**: Halaman untuk mengatur Alokasi Target Mingguan (ATM) untuk Sabaq, Sabqi, dan Manzil.
3. **Rekap Hafalan (`MemorizationRecap.tsx`)**: Laporan rekapitulasi capaian hafalan santri.
4. **Kelola Progres (`ManageStudentProgress.tsx`)**: Pengelolaan status progres santri (Juz/Halaman saat ini).
5. **Direktori Santri & Wali (`StudentDirectory`, `GuardianDirectory`)**: Melihat data kontak dan profil santri serta walinya.
6. **Nilai Ujian (`ExamGrades.tsx`)**: Mencatat dan mengelola nilai ujian hafalan santri.

### 🧠 Logika Inti & Aturan Sistem
Role Guru banyak berinteraksi dengan **Core Logic Hafalan**:

1. **Tipe Hafalan (Sabaq, Sabqi, Manzil)**
   *   **Sabaq**: Hafalan baru.
   *   **Sabqi**: Pengulangan hafalan baru (biasanya mundur beberapa halaman/juz dari Sabaq).
   *   **Manzil**: Muraja'ah/pengulangan hafalan lama.

2. **Alur Sabaq (Surah Progression)**
   *   Alur setoran hafalan **tidak mengikuti urutan mushaf dari Juz 1 ke 30**, melainkan mengikuti alur spesifik: **Juz 30 (belakang ke depan: An-Naba' -> An-Nas) -> Juz 29 -> Juz 28 -> dst.** (disimpan di konstanta `SURAH_PROGRESSION`).
   *   Opsi pemilihan Surat pada form di-_filter_ secara otomatis agar guru hanya bisa memilih surat yang posisinya berada di depan surat terakhir yang disetor (berdasarkan `SURAH_PROGRESSION`).

3. **Alokasi Target Mingguan (ATM)**
   *   ATM diatur di halaman **Target Pekanan**.
   *   **Sabqi Target**: Mengatur target halaman dan surat untuk Sabqi.
   *   **Manzil Target**: Mengatur target surat/halaman untuk Manzil.
   *   Sistem menghitung otomatis ketuntasan ATM berdasarkan total baris/halaman yang dicapai dalam minggu berjalan (Status: A [Terlampaui], B [Tercapai], C [Tidak Tercapai]).

### 🔄 Alur Kerja (Workflows)

#### A. Alur Inisialisasi Santri Baru
Ketika seorang santri belum memiliki data setoran sama sekali, sistem akan meminta Inisialisasi Posisi Awal:
1. Guru membuka **Input Hafalan**.
2. Sistem mendeteksi tidak ada histori hafalan, lalu memunculkan modal inisialisasi.
3. Guru menginput **Posisi Sabaq Terakhir** (Pilih Surat & Ayat).
4. **Logika Otomatisasi**: Sistem mengecek data ATM (Target Pekanan) pekan ini.
   *   Jika ada ATM, posisi awal **Sabqi** dan **Manzil** akan mengambil data dari `sabqi_target_surat` dan `manzil_target`.
   *   Jika belum ada ATM (kosong), maka Sabqi dan Manzil akan menggunakan (*fallback*) posisi Sabaq.
5. Sistem menyimpan ketiga posisi tersebut ke database (dual-write ke `memorization_records` dan `weekly_memorization`).

#### B. Alur Input Setoran Harian (Sabaq, Sabqi, Manzil)
1. **Pemilihan Konteks**: Guru memilih tanggal dan santri pada halaman **Input Hafalan**.
2. **Pemilihan Tipe**: Guru memilih tipe setoran (Sabaq/Sabqi/Manzil).
3. **Logika & Validasi Khusus Sabaq**:
   *   **Filter Dropdown Surat**: Surat yang muncul di _dropdown_ Sabaq tidak menampilkan seluruh 114 surat. Sistem mem-filter _dropdown_ berdasarkan posisi Sabaq terakhir santri. Hanya surat-surat yang berada di depan posisi terakhir (berdasarkan urutan `SURAH_PROGRESSION`) yang bisa dipilih.
   *   **Auto-Advance (Ripple Effect)**: Jika santri telah menyelesaikan ayat terakhir dari suatu surat (misal: An-Naba' ayat 40), maka saat guru menginput baris baru, _dropdown_ surat akan secara **otomatis berpindah (lompat)** ke surat berikutnya sesuai alur sabaq (misal: An-Nazi'at), bukan kembali ke ayat 1 surat yang sama.
   *   **Pemisahan Logika Fisik vs Progresi**: Sistem secara ketat memisahkan dua jenis urutan ayat:
       *   _Urutan Fisik Mushaf_ (`getNextAyahPhysical`): Digunakan murni di latar belakang untuk menghitung total baris dan halaman fisik yang disetor.
       *   _Urutan Progresi Sabaq_ (`getNextAyah`): Digunakan untuk menentukan "titik setoran berikutnya", memastikan perpindahan lintas Juz berjalan mulus (misal dari An-Nas langsung pindah ke Al-Mulk ayat 1).
   *   **Validasi Mundur**: Sistem melarang (disable/memfilter) guru untuk memasukkan setoran Sabaq yang posisinya berada **di belakang** (lebih lambat) dari posisi yang sudah dicapai santri. Sabaq sifatnya harus selalu maju.
4. **Penyimpanan (Dual-Write)**: Saat data disimpan, sistem mencatat histori capaian historis ke tabel `memorization_records` dan mengakumulasi jumlah baris/halaman ke format JSON mingguan di tabel `weekly_memorization`.
5. **Notifikasi Otomatis**: Jika diatur, wali santri terkait akan menerima WhatsApp/Push Notification secara _real-time_ bahwa setoran telah berhasil diinput.

---

## 2. Role: ADMIN
Admin sekolah (Tenant Admin) bertugas mengelola data master, guru, santri, dan memantau operasional harian sekolah.

### 📋 Daftar Fitur (Views)
1. **Manajemen User (`UserManagement.tsx`)**: Menambah/menghapus/mengubah data Guru dan Staff.
2. **Manajemen Wali (`GuardianManagement.tsx`)**: Mengelola akun Wali Santri dan menghubungkannya dengan profil Santri.
3. **Manajemen Kelas & Halaqah (`ClassManagement`, `HalaqahManagement`)**: Mengatur pengelompokan akademik santri.
4. **Manajemen Target (`TargetManagement.tsx`)**: Mengatur template standar target hafalan sekolah.
5. **Monitoring (`MonitorHafalan`, `WeeklyTargetMonitor`)**: Memantau grafik dan statistik setoran seluruh guru/halaqah.
6. **Audit Logs (`AuditLogs.tsx`)**: Melihat riwayat aktivitas (Insert/Update/Delete) di level sekolah.

### 🔄 Alur Kerja (Workflows)
*   **Onboarding Santri Baru**: Admin membuat data Santri -> Assign ke Kelas & Halaqah -> Membuat akun Wali Santri dan meng-_link_ kan (parent_id) ke Santri -> Guru di Halaqah terkait baru bisa melakukan "Inisialisasi Santri Baru".

---

## 3. Role: GUARDIAN (WALI SANTRI / PARENT)
Wali santri diberikan akses _read-only_ ke portal yang sangat spesifik (hanya melihat data anaknya sendiri).

### 📋 Daftar Fitur (Views)
1. **Laporan & Dashboard (`GuardianReports.tsx`)**: Melihat statistik pencapaian (grafik) harian dan mingguan.
2. **Progres Hafalan (`StudentProgress.tsx`)**: Melihat riwayat baris/halaman dan Juz yang sudah dikuasai.
3. **Catatan Guru (`TeacherNotesList.tsx`)**: Membaca _feedback_, motivasi, atau evaluasi dari Guru/Ustadz.
4. **Nilai Ujian (`GuardianExamResults.tsx`)**: Melihat rapor dan kelulusan ujian tahfizh.
5. **Pencapaian (`StudentAchievements.tsx`)**: _Gamification_ atau penghargaan digital dari sekolah.

### 🔄 Alur Kerja (Workflows)
*   **Monitoring Harian**: Wali login -> Dashboard otomatis me-load data spesifik santrinya -> Menampilkan "Status Setoran Terakhir" dan notifikasi _real-time_ jika guru baru saja menginput Sabaq/Sabqi/Manzil hari itu.

---

## 4. Role: SUPERADMIN
Pihak pengembang/pengelola platform QurMa (Bukan pihak sekolah).

### 📋 Daftar Fitur
1. **Tenant Management**: Menambah sekolah/pesantren baru. Mengatur paket berlangganan (Basic/Pro/Enterprise).
2. **Global Platform Settings**: Konfigurasi nama platform, template email pendaftaran, dll.
3. **Global Audit Logs**: Melihat _semua_ aktivitas lintas institusi/tenant.

### 🧠 Logika Inti
*   Beroperasi murni di luar batasan Tenant (RLS `tenant_id` dilewati) untuk manajemen level platform.

---

## Ringkasan Integrasi Modul (Cross-Module Logic)
Fitur inti QurMa memiliki ketergantungan yang kuat antara **Target Pekanan (ATM)** (oleh Guru) dan **Input Hafalan** (oleh Guru), yang dipantau oleh **Monitor** (oleh Admin) dan dilaporkan ke **Dashboard** (oleh Wali). Perubahan logika di utilitas kustom seperti `calculateLines`, `calculatePages`, dan pengurutan khusus `SURAH_PROGRESSION` (di `lib/quranUtils.ts`) akan mempengaruhi seluruh modul ini secara otomatis.
