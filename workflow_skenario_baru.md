# Workflow: Rekayasa Ulang Algoritma dan Kriteria Skenario LCCA

## Deskripsi
Workflow ini menginstruksikan agen untuk memodifikasi parameter logika *trigger values* (ambang batas IRI), jenis intervensi struktural, serta memperbarui nomenklatur antarmuka untuk dua skenario pemeliharaan jalan: Skenario 1 (Preventif/Proaktif) dan Skenario 2 (Reaktif/Penanganan Tertunda)[cite: 2].

## Konteks
*   **Target Lingkungan:** HTML5 (Antarmuka) dan Vanilla JavaScript (Logika Komputasi LCCA).
*   **Ruang Lingkup File:** File HTML utama (misal: `index.html`) dan file JavaScript utama (misal: `script.js` atau `calculations.js`) yang memuat fungsi *if/else* penanganan IRI.

## Langkah Eksekusi

### Langkah 1: Modifikasi Nomenklatur dan Filosofi Antarmuka (HTML)
1.  Pindai file HTML dan perbarui teks judul untuk Skenario 1 menjadi "Skenario 1: Skenario Preventif / Proaktif (Kondisi Mantap)"[cite: 2].
2.  Ubah deskripsi Skenario 1 untuk mencerminkan filosofi intervensi dini: "Mencegah lebih murah daripada membangun kembali"[cite: 2]. Masukkan keterangan mengenai pelapisan aspal tipis secara berkala di awal untuk meredam kerusakan akibat air dan beban berat[cite: 2].
3.  Perbarui teks judul untuk Skenario 2 menjadi "Skenario 2: Skenario Reaktif / Penanganan Tertunda (Standar Pelayanan Minimum)"[cite: 2].
4.  Ubah deskripsi Skenario 2 untuk mencerminkan kebijakan penundaan perbaikan: "Maksimalkan masa pakai aspal eksisting"[cite: 2]. Masukkan keterangan bahwa skenario ini menekan anggaran konstruksi awal dengan membiarkan perkerasan memikul beban hingga mendekati batas regulasi[cite: 2].

### Langkah 2: Restrukturisasi Logika Komputasi Skenario 1 (JavaScript)
1.  Lokasikan fungsi JavaScript yang mengkalkulasi degradasi IRI dan memicu biaya penanganan untuk Skenario 1.
2.  Rombak operator kondisional (`if/else`) menjadi empat tingkatan intervensi ketat berikut:
    *   Jika $IRI < 4 \text{ m/km}$: Eksekusi "Pemeliharaan Rutin" tahunan (seperti *patching* lokal)[cite: 2].
    *   Jika $4 \le IRI < 6 \text{ m/km}$: Eksekusi "Pemeliharaan Berkala" berupa pelapisan ulang tipis 4 cm hingga 5 cm[cite: 2]. Integrasikan fungsi yang melakukan *reset* nilai IRI kembali ke kondisi awal mantap di angka $\approx 2,0 \text{ m/km}$[cite: 2].
    *   Jika $6 \le IRI < 8 \text{ m/km}$: Eksekusi "Rehabilitasi Minor/Struktural" (berupa *overlay* tebal 8 cm)[cite: 2].
    *   Jika $IRI \ge 8 \text{ m/km}$: Eksekusi "Rekonstruksi/Rehabilitasi Mayor" (seperti pembongkaran atau *overlay* struktural tebal $> 10 \text{ cm}$)[cite: 2].
3.  Pastikan perhitungan matriks arus kas memanggil variabel biaya yang berkorespondensi dengan masing-masing jenis intervensi tersebut.

### Langkah 3: Restrukturisasi Logika Komputasi Skenario 3 (JavaScript)
1.  Lokasikan fungsi komputasi untuk Skenario 2.
2.  Rombak operator kondisional (`if/else`) menjadi tiga tingkatan intervensi reaktif berikut:
    *   Jika $IRI < 6 \text{ m/km}$: Eksekusi hanya "Pemeliharaan Rutin" tahunan[cite: 2].
    *   Jika $6 \le IRI < 10 \text{ m/km}$: Eksekusi "Pemeliharaan Berkala/Overlay struktural"[cite: 2].
    *   Jika $IRI \ge 10 \text{ m/km}$: Eksekusi "Rekonstruksi Total"[cite: 2].
3.  Pastikan matriks biaya disesuaikan agar biaya operasional sangat murah pada Tahun 1-10 (hanya rutin), dan memicu ledakan biaya rekonstruksi yang sangat mahal di tahun-tahun tengah/akhir saat ambang batas tercapai[cite: 2].

### Langkah 4: Validasi Pembentukan Kurva Degradasi
1.  Jalankan server pratinjau lokal.
2.  Lakukan injeksi data parameter IRI awal dan amati grafik visual yang terbentuk.
3.  Verifikasi bahwa skrip Skenario 1 berhasil membentuk grafik IRI dengan pola gigi gergaji (*sawtooth*) yang rapat dan pendek[cite: 2].
4.  Verifikasi bahwa skrip Skenario 2 menghasilkan grafik dengan kurva kenaikan IRI yang tajam dan tinggi, yang kemudian jatuh tajam secara vertikal saat rekonstruksi dilakukan[cite: 2].