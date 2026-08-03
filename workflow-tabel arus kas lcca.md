# Workflow: Resolusi Bug Rendering DOM pada Header Tabel Arus Kas LCCA

## Deskripsi
Workflow ini menugaskan agen untuk memperbaiki anomali struktural pada `<thead>` tabel "Rincian Arus Kas Tahunan". Fokus utama adalah menghapus string "Rp 0" yang terinjeksi secara tidak valid ke dalam sel header dan merestrukturisasi atribut `rowspan` serta `colspan` agar hierarki tabel berstandar HTML5.

## Konteks
*   **Target Lingkungan:** HTML5, CSS3, Vanilla JavaScript.
*   **Ruang Lingkup File:** File utama antarmuka (misal: `index.html`) dan file logika (misal: `script.js` atau `calculations.js`).

## Langkah Eksekusi

### Langkah 1: Pembersihan Elemen Statis HTML
1.  Pindai file HTML dan lokasikan elemen `<table>` yang berada di bawah judul "Rincian Arus Kas Tahunan (Cash Flow LCCA)".
2.  Inspeksi blok `<thead>`. Cari keberadaan *string* "Rp 0" atau elemen `<br>`/`<span>` tidak relevan yang tertanam di dalam atau di atas teks "Biaya Riil" dan "Present Value (PV)".
3.  Hapus secara permanen seluruh teks "Rp 0" tersebut dari dalam elemen `<th>`.

### Langkah 2: Restrukturisasi Atribut Tabular (rowspan & colspan)
1.  Rombak struktur `<thead>` tabel tersebut agar mematuhi hierarki dua baris (`<tr>`) murni berikut:
    *   **Baris 1 (`<tr>` pertama):** 
        *   `<th rowspan="2">Tahun</th>`
        *   `<th colspan="2">Skenario 1 (Reaktif)</th>`
        *   `<th colspan="2">Skenario 2 (Preventif)</th>`
    *   **Baris 2 (`<tr>` kedua):**
        *   `<th>Biaya Riil</th>`
        *   `<th>Present Value (PV)</th>`
        *   `<th>Biaya Riil</th>`
        *   `<th>Present Value (PV)</th>`
2.  Pastikan tidak ada atribut `<th>` tambahan atau yang hilang dari struktur absolut di atas.

### Langkah 3: Koreksi Penargetan DOM JavaScript (Jika Relevan)
1.  Pindai file JavaScript yang mengelola inisialisasi data tabel (misalnya fungsi `renderCashFlowTable()` atau saat inisialisasi awal DOM).
2.  Identifikasi apakah ada fungsi manipulasi DOM yang melakukan *append* atau *innerHTML* berisi variabel `Rp 0` ke elemen target kelas (class) atau ID yang merujuk pada `<thead>` tabel tersebut.
3.  Apabila fungsi tersebut dimaksudkan untuk menampilkan total keseluruhan (akumulasi biaya), alihkan penargetan injeksi elemen DOM tersebut dari `<thead>` menuju blok semantik `<tfoot>` di bagian paling bawah tabel. Jika fungsi tersebut tidak krusial, hapus baris injeksi tersebut.

### Langkah 4: Validasi Rendering Antarmuka
1.  Jalankan server pratinjau lokal secara otonom.
2.  Inspeksi antarmuka halaman pada bagian tabel arus kas. Pastikan teks sub-header hanya berisi "Biaya Riil" dan "Present Value (PV)" dengan properti rata tengah (*center alignment*) murni, tanpa adanya tumpukan teks "Rp 0".
3.  Uji kompatibilitas *sticky header* saat tabel digulir ke bawah, pastikan dua baris `<thead>` yang direstrukturisasi tetap menyatu dan tidak terpisah.