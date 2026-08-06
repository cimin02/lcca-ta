# Workflow: Implementasi Tooltip Rincian Biaya (Cost Breakdown) pada Tabel Arus Kas

## Deskripsi
Workflow ini menugaskan agen untuk mengekstraksi komponen rincian biaya pemeliharaan tahunan (Rutin, Berkala, Rehabilitasi, Rekonstruksi) dan menampilkannya sebagai elemen antarmuka *tooltip* interaktif yang muncul saat pengguna melakukan *hover* pada sel "Biaya Riil" di dalam matriks "Rincian Arus Kas Tahunan".

## Konteks
*   **Target Lingkungan:** HTML5, CSS3, Vanilla JavaScript.
*   **Ruang Lingkup File:** File JavaScript utama (logika komputasi & render DOM tabel) dan file *stylesheet* (CSS).

## Langkah Eksekusi

### Langkah 1: Modifikasi Lapisan Data (State JavaScript)
1.  Pindai fungsi kalkulator LCCA yang memproses iterasi biaya tahunan.
2.  Saat ini, fungsi tersebut kemungkinan hanya menyimpan akumulasi "Total Biaya" per tahun. Modifikasi logika penyimpanan (*array/object*) agar sistem juga menyimpan variabel rincian komposisi pembentuk total biaya tersebut.
3.  Format penyimpanan yang diharapkan per tahun (contoh skema JSON): 
    `{ tahun: 1, totalBiaya: 53671500000, rincian: { rutin: 50000000, berkala: 0, rekonstruksi: 53621500000 } }`

### Langkah 2: Injeksi Struktur DOM Tooltip (JavaScript Render)
1.  Lokasikan fungsi yang melakukan iterasi pembuatan baris tabel (`<tr>` dan `<td>`) untuk dirender ke dalam `<tbody>` tabel arus kas.
2.  Modifikasi injeksi elemen DOM pada kolom "Biaya Riil" untuk Skenario 1 dan Skenario 2.
3.  Tambahkan sebuah elemen `<span>` atau `<div>` dengan *class* `cost-tooltip` di dalam tag `<td>` Biaya Riil, tepat di sebelah teks angka total.
4.  Susun struktur HTML di dalam `<td>` tersebut menjadi seperti ini (gunakan *template literals*):
    ```html
    <td class="relative-cell">
       Rp [Total Biaya]
       <div class="cost-tooltip">
           <strong>Rincian Biaya:</strong><br>
           Rutin: Rp [Nilai Rutin]<br>
           Berkala: Rp [Nilai Berkala]<br>
           Rekonstruksi: Rp [Nilai Rekon]
       </div>
    </td>
    ```
5.  Pastikan rincian yang bernilai `Rp 0` (tidak ada intervensi pada tahun tersebut) diabaikan atau difilter agar tidak meramaikan isi kotak *tooltip*.

### Langkah 3: Penataan Gaya Interaktif (CSS)
1.  Buka file CSS dan tambahkan aturan penataan gaya (*styling*) berikut untuk merekayasa *hover state*:
2.  Deklarasikan properti `position: relative;` pada *class* `.relative-cell` (atau langsung pada elemen `<td>` yang membungkus *tooltip*).
3.  Konfigurasi *class* `.cost-tooltip` dengan properti berikut untuk menyembunyikannya secara bawaan:
    `visibility: hidden; opacity: 0; position: absolute; z-index: 50; background-color: #333; color: #fff; padding: 10px; border-radius: 6px; width: 250px; bottom: 125%; left: 50%; transform: translateX(-50%); transition: opacity 0.3s; box-shadow: 0px 4px 6px rgba(0,0,0,0.2); font-size: 0.85rem; line-height: 1.5; pointer-events: none;`
4.  Tambahkan *pseudo-class* hover untuk menampilkan *tooltip* tersebut:
    `.relative-cell:hover .cost-tooltip { visibility: visible; opacity: 1; }`
5.  (Opsional) Tambahkan elemen panah kecil di bagian bawah *tooltip* menggunakan *pseudo-element* `::after` pada `.cost-tooltip` agar secara estetika terlihat seperti balon dialog profesional.

### Langkah 4: Validasi Interaksi Antarmuka
1.  Jalankan server pratinjau lokal.
2.  Lakukan kalkulasi data hingga tabel arus kas terisi.
3.  Arahkan kursor (*mouse hover*) secara perlahan ke salah satu angka "Biaya Riil" pada Tahun 1.
4.  Verifikasi bahwa kotak hitam berisi rincian (Pemeliharaan Rutin, Berkala, dll.) muncul di atas angka tersebut, dan hilang dengan transisi halus saat kursor dijauhkan. Pastikan posisi *tooltip* tidak tertutup oleh *sticky header* tabel.