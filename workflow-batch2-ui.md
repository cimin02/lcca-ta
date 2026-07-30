# Workflow: Koreksi Algoritma Inti Degradasi dan Evaluasi LCCA (Batch 2)

## Deskripsi
Workflow ini menginstruksikan agen untuk merefaktor logika matematika dan algoritma komputasi pada skrip JavaScript LCCA. Fokus utama adalah integrasi pertumbuhan CESA eksponensial terhadap umur rencana, penyesuaian kriteria intervensi fungsional jalan, dan penetapan algoritma pencarian skenario optimal yang berbasis murni pada probabilitas deterministik nilai NPV terendah.

## Konteks
*   **Target Lingkungan:** Vanilla JavaScript (Sistem *Client-Side*).
*   **Ruang Lingkup File:** File JavaScript utama (misal: `script.js` atau `calculations.js`) yang mengelola fungsi komputasi prediktif jalan dan komparasi kelayakan ekonomi LCCA.

## Langkah Eksekusi

### Langkah 1: Rekayasa Dinamis Parameter CESA & Prediksi IRI (Poin 2 & 3)
1.  Pindai file JavaScript dan identifikasi fungsi yang bertanggung jawab menghitung parameter *Cumulative Equivalent Standard Axle* (CESA) atau variabel $NE_t$ pada model persamaan degradasi.
2.  Hapus penggunaan variabel statis atau nilai CESA yang direplikasi konstan setiap tahunnya.
3.  Implementasikan perulangan matematis (*looping*) untuk mengeksekusi perhitungan pertumbuhan lalu lintas secara eksponensial pada setiap iterasi tahun. Formulanya berbasis pada nilai CESA awal dan Faktor Pertumbuhan Lalu Lintas (misal: $NE_t = CESA_{awal} \times (1 + i)^t$, di mana $i$ adalah laju pertumbuhan lalu lintas dan $t$ adalah tahun berjalan).
4.  Integrasikan variabel $NE_t$ dinamis tersebut secara spesifik ke dalam persamaan empiris prediksi IRI pada perulangan tahun ke-1 hingga akhir umur rencana.

### Langkah 2: Kalibrasi Kriteria Pemicu (Trigger) Intervensi (Poin 11)
1.  Lakukan inspeksi pada operator logika kondisional (statemen `if/else`) yang mengatur pemicu simulasi injeksi biaya penanganan rekonstruksi/rehabilitasi pada masing-masing segmen jalan.
2.  Modifikasi parameter ambang batas fungsional (*functional threshold*) dari `IRI > 10` menjadi `IRI > 8`.
3.  Pastikan pergeseran nilai ini tersinkronisasi ke seluruh kalkulasi arus kas (*cash flow*) sehingga penanganan berat otomatis tereksekusi pada tahun ketika IRI menyentuh angka 8 m/km.

### Langkah 3: Objektivikasi Komparasi Skenario Optimal (Poin 5)
1.  Identifikasi blok kode yang bertanggung jawab menentukan dan merender status "Skenario Paling Optimal" pada komponen visual di antarmuka HTML (misalnya logika yang memberikan lencana hijau atau ikon rekomendasi).
2.  Hapus *hardcode* atau pengondisian paksa yang secara absolut menetapkan "Skenario 2" sebagai pemenang, terlepas dari hasil komputasi *Net Present Value* (NPV).
3.  Bangun logika perbandingan deterministik murni yang mengevaluasi skenario berdasarkan nilai terendah absolut. Contoh struktur logikanya: `if (npvSkenario2 < npvSkenario1) { return "Skenario 2" } else { return "Skenario 1" }`.
4.  Pastikan persentase penghematan (selisih biaya) dikalkulasi secara presisi dan dinamis menggunakan rumus `((NPV Tertinggi - NPV Terendah) / NPV Tertinggi) * 100%`.

### Langkah 4: Validasi Integritas Komputasi LCCA
1.  Jalankan *local server* secara otonom di *background*.
2.  Verifikasi pada *console.log* bahwa nilai CESA ($NE_t$) pada iterasi tahun ke-2, ke-3, dst., mengalami kenaikan (tidak flat/statis).
3.  Simulasikan skenario ekstrem (misalnya mengatur suku bunga diskonto sangat tinggi); pastikan Skenario 1 dapat ditetapkan sebagai opsi optimal apabila angka keluaran NPV-nya lebih rendah, untuk membuktikan sistem tidak lagi melakukan *hardcode* pada Skenario 2.