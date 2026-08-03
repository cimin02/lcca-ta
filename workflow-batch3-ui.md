# Workflow: Dinamisasi Parameter Eksternal dan Modul Ekspor Data (Batch 3)

## Deskripsi
Workflow ini menugaskan agen untuk mengimplementasikan integrasi antarmuka pemrograman aplikasi (API) eksternal guna mengotomatisasi penarikan data makroekonomi secara *real-time*. Selain itu, instruksi ini mencakup *refactoring* pada modul generator dokumen *spreadsheet* (Excel) agar panjang baris komputasi arus kas (*cash flow*) selaras secara dinamis dengan variabel umur rencana jalan.

## Konteks
*   **Target Lingkungan:** Vanilla JavaScript, *Fetch API*, Pustaka Ekspor Excel (contoh: SheetJS / `xlsx.js`).
*   **Ruang Lingkup File:** File HTML untuk formulir parameter desain dan file JavaScript yang mengelola *event listener* serta ekspor data.

## Langkah Eksekusi

### Langkah 1: Integrasi API Parameter Ekonomi Makro (Poin 1)
1.  Buat fungsi asinkron (contoh: `fetchEconomicParameters()`) di JavaScript menggunakan *Fetch API* untuk mengambil data Tingkat Suku Bunga Acuan (BI-Rate) dan Tingkat Inflasi dari *endpoint* publik yang relevan atau layanan pihak ketiga yang menyediakan data Bank Indonesia.
2.  Injeksi nilai respons (JSON) dari API tersebut ke dalam elemen DOM (tag `<input>`) untuk variabel "Suku Bunga" dan "Inflasi" sebagai nilai bawaan (*default value*) saat inisialisasi awal (*onload*).
3.  Pastikan elemen `<input>` tersebut tidak dikunci (jangan gunakan atribut `readonly` atau `disabled`). Terapkan arsitektur hibrida agar pengguna memiliki hak akses penuh untuk melakukan *override* (modifikasi manual) pada nilai tersebut sesuai dengan spesifikasi proyek LCCA instansi terkait.
4.  Tambahkan indikator visual berupa teks mikro (`<small>`) di bawah *input field* yang menampilkan status penarikan data (misal: "Sumber: Data Historis API [Timestamp]" atau "Sumber: Input Manual").

### Langkah 2: Dinamisasi Iterator Ekspor Excel (Poin 10)
1.  Pindai fungsi JavaScript yang bertanggung jawab untuk mengekstrak data tabel HTML (atau *state object*) dan mengonversinya menjadi dokumen biner `.xlsx` (seperti `exportToExcel()`).
2.  Identifikasi blok perulangan (*looping*) algoritma yang merekonstruksi baris (*row*) data untuk *sheet* "Rincian Arus Kas Tahunan".
3.  Hapus nilai konstan/statis `20` pada batas iterasi *loop* tersebut (sebagai contoh, ubah `for (let i = 0; i <= 20; i++)`).
4.  Ganti variabel statis tersebut dengan pemanggilan variabel status global yang merepresentasikan nilai "Umur Rencana" (misal: variabel $N$) yang telah di-input oleh pengguna pada parameter desain.
5.  Pastikan matriks larik (*array matrix*) yang diekspor hanya mencakup kolom Skenario 1 dan Skenario 2 (sesuai restrukturisasi dari Batch 1) dan secara akurat berhenti pada baris tahun ke-$N$.

### Langkah 3: Validasi Jaringan dan Fungsionalitas Ekspor
1.  Jalankan modul pengujian *server* lokal secara otonom.
2.  Lakukan inspeksi pada *Network Tab* di *developer tools* peramban; pastikan penarikan data API bersifat *non-blocking* sehingga tidak menunda pemuatan visualisasi halaman utama.
3.  Simulasikan eksekusi komputasi dengan menetapkan umur rencana menjadi 12 tahun. Inisiasi fungsi ekspor Excel, lalu verifikasi *buffer* data yang dihasilkan; pastikan baris iterasi tahun pada arus kas berhenti tepat di angka 12, dan tidak lagi menghasilkan 20 baris.