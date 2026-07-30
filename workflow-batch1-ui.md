# Workflow: Optimasi UI/UX dan Restrukturisasi Matriks Data LCCA (Batch 1)

## Deskripsi
Workflow ini menginstruksikan agen untuk melakukan *refactoring* pada antarmuka pengguna (HTML/CSS) dan manipulasi *Document Object Model* (DOM) pada skrip JavaScript. Fokus utama adalah penyederhanaan komparasi LCCA menjadi dua skenario biner, restrukturisasi semantik tabel untuk konsistensi visual, dan dinamisasi *parser* matriks data survei jalan.

## Konteks
*   **Target Lingkungan:** HTML5, CSS3, Vanilla JavaScript (Sistem Client-Side).
*   **Ruang Lingkup File:** File utama HTML (seperti `index.html`) dan file JavaScript yang menangani logika UI serta perhitungan kalkulator LCCA.

## Langkah Eksekusi

### Langkah 1: Reduksi Kompleksitas Skenario Pemeliharaan (Poin 4 & 8)
1.  Pindai file HTML dan identifikasi semua elemen struktural (`<div>`, `<section>`, `<canvas>`) yang merepresentasikan "Skenario 3: Rehabilitasi & Rekonstruksi".
2.  Hapus seluruh blok elemen antarmuka Skenario 3 tersebut, termasuk kartu perbandingan *Net Present Value* (NPV) Skenario 3 dan baris Skenario 3 pada tabel "Analisis Sensitivitas".
3.  Pindai skrip JavaScript dan modifikasi fungsi perenderan "Peta Strip Kondisi Jalan (Strip Map)".
4.  Batasi perulangan (*loop*) pada fungsi penggambaran *strip map* agar secara eksklusif hanya merender visualisasi degradasi untuk Skenario 1 (Reaktif) dan Skenario 2 (Preventif). Hapus blok kode yang merender grafis Skenario 3.
5.  Hapus variabel, *array*, atau objek pada *state* JavaScript yang menyimpan hasil kalkulasi LCCA untuk Skenario 3.

### Langkah 2: Dinamisasi Skalabilitas Matriks Data Lintasan (Poin 6)
1.  Modifikasi fungsi JavaScript yang bertugas mengurai (*parsing*) unggahan file CSV atau input manual pada modul "Data IRI Awal Per Segmen".
2.  Ubah logika penangkapan data (*data fetching*) yang sebelumnya statis (misal: variabel di-*hardcode* untuk 3 lintasan) menjadi dinamis. Gunakan *array.length* dari *header* data masukan untuk menentukan jumlah kolom lintasan survei (variabel $n$).
3.  Rombak fungsi komputasi "Rata-Rata IRI". Kalkulasi tidak lagi dibagi dengan angka konstan, melainkan menggunakan akumulasi dinamis: `Total IRI seluruh lintasan / n`.
4.  Perbarui fungsi perenderan tabel DOM agar menyisipkan jumlah kolom `<th>` dan `<td>` "Lintasan" secara iteratif berdasarkan nilai $n$ tersebut sebelum kolom "Rata-Rata IRI".

### Langkah 3: Restrukturisasi Semantik Hierarki Tabel (Poin 7 & 9)
1.  Lakukan *refactoring* pada elemen `<thead>` di tabel "Data IRI Per Segmen". Pastikan penggabungan sel menggunakan atribut `rowspan` dan `colspan` yang presisi secara matematis, sehingga label "Lintasan" dan "Rata-Rata" memiliki hierarki visual yang simetris dan konsisten.
2.  Lakukan *refactoring* pada elemen `<thead>` di tabel "Rincian Arus Kas Tahunan (Cash Flow LCCA)".
3.  Modifikasi atribut kolom pada tabel Arus Kas Tahunan agar hanya mengakomodasi Skenario 1 dan Skenario 2. Susunan kolom wajib direkonstruksi menjadi: Tahun, Skenario 1 - Biaya Riil, Skenario 1 - *Present Value* (PV), Skenario 2 - Biaya Riil, Skenario 2 - *Present Value* (PV). Hapus atribut kolom untuk Skenario 3.
4.  Implementasikan properti CSS `position: sticky; top: 0; z-index: 10;` pada elemen `<th>` di kedua tabel tersebut. Hal ini memastikan *header* tabel tetap berada di posisi atas (statis) saat pengguna melakukan pengguliran vertikal (*vertical scroll*) pada matriks data yang padat.

### Langkah 4: Validasi Integritas DOM
1.  Jalankan *local server* dan inspeksi halaman secara otonom.
2.  Verifikasi bahwa pengunggahan *dummy data* dengan 2 lintasan maupun 4 lintasan tidak memicu *error* (NaN) pada tabel Data IRI dan rata-rata terhitung dengan presisi.
3.  Pastikan tidak ada entitas atau residu perhitungan Skenario 3 yang bocor dan merusak tata letak elemen di *frontend*.