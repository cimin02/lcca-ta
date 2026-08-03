# Workflow: Resolusi Transparansi (Z-Index & Background) Header Tabel Arus Kas

## Deskripsi
Workflow ini menugaskan agen untuk memperbaiki anomali visual (transparansi) pada *header* tabel yang mengambang (*sticky header*) saat dilakukan pengguliran vertikal. Fokus utama adalah modifikasi spesifisitas CSS pada elemen `<thead>` dan `<th>`.

## Konteks
*   **Target Lingkungan:** CSS3.
*   **Ruang Lingkup File:** File *stylesheet* (misal: `style.css`) atau blok `<style>` di dalam file HTML utama.

## Langkah Eksekusi

### Langkah 1: Inspeksi dan Identifikasi Selektor CSS
1.  Pindai file CSS dan lokasikan *class* atau selektor tag yang menargetkan *header* tabel arus kas (misalnya `table thead th`, `.table-lcca thead th`, atau selektor spesifik lainnya).
2.  Pastikan properti `position: sticky;` dan `top: 0;` sudah terdeklarasi pada selektor tersebut.

### Langkah 2: Injeksi Properti Opasitas dan Z-Index (Z-Axis)
1.  Tambahkan deklarasi properti warna latar belakang yang solid pada selektor `<th>` di dalam `<thead>` tersebut. Gunakan nilai `background-color: #ffffff;` (putih) atau sesuaikan dengan palet warna abu-abu/hijau muda bawaan desain tabel (contoh: `background-color: #f8f9fa;`).
2.  Tambahkan properti `z-index: 10;` (atau nilai numerik yang lebih tinggi jika terjadi konflik *stacking context*) untuk menjamin elemen *header* tersebut berada pada sumbu-Z (*z-axis*) teratas di atas baris tabel `<tbody>`.
3.  Untuk menjaga konsistensi garis batas (*border*), pastikan properti *border* juga didefinisikan secara statis pada `<th>`, misalnya `border-bottom: 2px solid #dee2e6;`, agar pemisah antara *header* dan konten tabel tetap terlihat tegas saat proses pengguliran.

### Langkah 3: Validasi Rendering Antarmuka
1.  Jalankan server pratinjau lokal.
2.  Populasikan data simulasi (atau *dummy data*) hingga tabel arus kas menghasilkan baris lebih dari 15 tahun agar fitur pengguliran (*scroll*) aktif.
3.  Lakukan pengguliran ke bawah secara perlahan; verifikasi bahwa teks "Biaya Riil" dan "Present Value (PV)" pada *header* tetap solid (tidak transparan) dan berhasil menutupi baris angka yang melintas di bawahnya.