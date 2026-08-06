/**
 * Engine Perhitungan Teknik Sipil & Ekonomi Teknik LCCA Jalan
 * Mengacu pada MDPJ 2024 dan Model Degradasi HDM-4
 */

// 1. Menghitung Faktor Pertumbuhan Lalu Lintas Kumulatif (R) untuk tahun ke-t
function calculateGrowthFactor(i, t) {
    if (i === 0) return t;
    const r = i / 100;
    return (Math.pow(1 + r, t) - 1) / r;
}

// 2. Menghitung CESA (Cumulative Equivalent Single Axle Load) dalam Juta
// LHR dan VDF adalah array berisi 8 elemen (sesuai 8 golongan kendaraan)
function calculateCESA(LHR, VDF, DD, DL, i, t) {
    let sumLHR_VDF = 0;
    for (let g = 0; g < 8; g++) {
        sumLHR_VDF += (LHR[g] || 0) * (VDF[g] || 0);
    }
    const R_t = calculateGrowthFactor(i, t);
    const cesal = sumLHR_VDF * 365 * DD * DL * R_t;
    return cesal / 1000000; // Mengubah ke Juta CESA
}

// 3. Menghitung Daya Dukung Tanah Dasar (SNSG)
function calculateSNSG(CBR) {
    if (CBR <= 0) return 0;
    const logCBR = Math.log10(CBR);
    return 3.51 * logCBR - 0.85 * Math.pow(logCBR, 2) - 1.43;
}

// 4. Menghitung Modified Structural Number (SNC)
function calculateSNC(SN, CBR) {
    const snsg = calculateSNSG(CBR);
    return SN + snsg;
}

// 5. Menghitung Nilai Proyeksi IRI Tahunan dengan Skenario Pemeliharaan
// Menggunakan pendekatan inkremental untuk mendukung perbaikan fungsional tanpa reset umur layan
function projectIRIAndTreatments(segIRI0, segCBR, segSN, roadParams, trafficParams, economicParams, treatmentParams, scenarioId) {
    const { m, length, segLength, width } = roadParams;
    const { LHR, VDF, DD, DL, i } = trafficParams;
    const { r_riil } = economicParams;
    const {
        triggerBerkala, triggerRehab, triggerRekon, postRepairIRI,
        costRutin, costBerkala, costRehab, costRekon,
        thicknessBerkala, thicknessRehab, thicknessRekon
    } = treatmentParams;

    const numYears = trafficParams.UR || 20;
    const projections = [];
    
    // Inisialisasi kondisi awal (Tahun 0)
    let currentIRI = segIRI0;
    let currentSNC = calculateSNC(segSN, segCBR);
    let initialSNC = currentSNC; // Simpan SNC awal untuk reset rekonstruksi
    
    // State virtual untuk melacak umur struktural (reset saat rekonstruksi)
    let t_virtual = 0;
    
    projections.push({
        year: 0,
        IRI: currentIRI,
        condition: getConditionLabel(currentIRI),
        treatment: "Kondisi Awal",
        cost: 0,
        discountedCost: 0
    });

    for (let year = 1; year <= numYears; year++) {
        t_virtual++;
        
        // Hitung CESA kumulatif untuk tahun t_virtual sejak reset terakhir
        const cesa_total_now = calculateCESA(LHR, VDF, DD, DL, i, t_virtual);
        const cesa_total_prev = t_virtual > 1 ? calculateCESA(LHR, VDF, DD, DL, i, t_virtual - 1) : 0;
        
        // Beban gandar kumulatif inkremental tahun ini (Juta CESA)
        const delta_NE = cesa_total_now - cesa_total_prev;
        
        // Beban gandar kumulatif sejak reset terakhir
        const NE_virtual = cesa_total_now;

        // 1. Proyeksi Degradasi Alami Inkremental tahun ini (HDM-4)
        // Formula HDM-4 untuk tahun berjalan
        const rawIRI_now = Math.exp(m * t_virtual) * (currentIRI + 725 * Math.pow(1 + currentSNC, -4.99) * NE_virtual);
        
        // Formula HDM-4 untuk akhir tahun lalu
        const rawIRI_prev = Math.exp(m * (t_virtual - 1)) * (currentIRI + 725 * Math.pow(1 + currentSNC, -4.99) * (t_virtual > 1 ? cesa_total_prev : 0));
        
        const delta_IRI = rawIRI_now - rawIRI_prev;
        
        // Nilai IRI sebelum intervensi tahun ini
        let tempIRI = currentIRI + delta_IRI;
        if (tempIRI < 0) tempIRI = 0;

        let treatment = "Pemeliharaan Rutin";
        let cost = 0;
        let finalIRI = tempIRI;

        // 2. Evaluasi Skenario Tindakan Pemeliharaan
        if (scenarioId === 1) {
            // Skenario 1: Skenario Preventif / Proaktif (Kondisi Mantap)
            // Filosofi: Intervensi dini berbasis 4 tingkatan ambang batas IRI ketat
            if (tempIRI < 4.0) {
                treatment = "Pemeliharaan Rutin";
                cost = calculateRutinCost(length, segLength, width, costRutin);
                finalIRI = tempIRI;
            } else if (tempIRI >= 4.0 && tempIRI < 6.0) {
                treatment = "Pemeliharaan Berkala";
                cost = calculateTreatmentCost(length, segLength, width, thicknessBerkala, costBerkala);
                finalIRI = postRepairIRI;
            } else if (tempIRI >= 6.0 && tempIRI < 8.0) {
                treatment = "Rehabilitasi Minor";
                cost = calculateTreatmentCost(length, segLength, width, thicknessRehab, costRehab);
                finalIRI = postRepairIRI;
            } else {
                // tempIRI >= 8.0
                treatment = "Rekonstruksi / Rehabilitasi Mayor";
                cost = calculateTreatmentCost(length, segLength, width, thicknessRekon, costRekon);
                finalIRI = postRepairIRI;
                // Reset umur struktural (t) dan SNC
                t_virtual = 0;
                currentSNC = initialSNC;
            }
        } 
        else if (scenarioId === 2) {
            // Skenario 2: Skenario Reaktif / Penanganan Tertunda (Standar Pelayanan Minimum)
            // Filosofi: Membiarkan perkerasan terdegradasi hingga batas regulasi sebelum penanganan berat
            if (tempIRI < 6.0) {
                treatment = "Pemeliharaan Rutin";
                cost = calculateRutinCost(length, segLength, width, costRutin);
                finalIRI = tempIRI;
            } else if (tempIRI >= 6.0 && tempIRI < 10.0) {
                treatment = "Pemeliharaan Berkala / Overlay Struktural";
                cost = calculateTreatmentCost(length, segLength, width, thicknessRehab, costRehab);
                finalIRI = postRepairIRI;
            } else {
                // tempIRI >= 10.0
                treatment = "Rekonstruksi Total";
                cost = calculateTreatmentCost(length, segLength, width, thicknessRekon, costRekon);
                finalIRI = postRepairIRI;
                // Reset umur struktural (t) dan SNC
                t_virtual = 0;
                currentSNC = initialSNC;
            }
        }

        // Hitung Present Value (PV) Biaya menggunakan discount rate riil (r_riil)
        const discountFactor = Math.pow(1 + (r_riil / 100), year);
        const discountedCost = cost / discountFactor;

        projections.push({
            year: year,
            IRI: finalIRI,
            condition: getConditionLabel(finalIRI),
            treatment: treatment,
            cost: Math.round(cost),
            discountedCost: Math.round(discountedCost)
        });

        // Simpan nilai IRI saat ini untuk perhitungan tahun berikutnya
        currentIRI = finalIRI;
    }

    return projections;
}

// Menghitung Biaya Pemeliharaan Rutin (Berdasarkan luas segmen jalan)
function calculateRutinCost(totalLength, segLength, width, unitCostRutin) {
    // Luas Segmen = segLength * width
    const area = segLength * width;
    return area * unitCostRutin; // Rp per segmen per tahun
}

// Menghitung Biaya Pemeliharaan Berkala / Rehab / Rekonstruksi (Volume * HSP)
function calculateTreatmentCost(totalLength, segLength, width, thickness, unitCost) {
    // Volume = segLength * width * tebal
    const volume = segLength * width * thickness;
    return volume * unitCost; // Rp per segmen
}

// Klasifikasi Label Kondisi Jalan berdasarkan Nilai IRI
function getConditionLabel(iri) {
    if (iri < 4) return "Baik";
    if (iri >= 4 && iri < 8) return "Sedang";
    if (iri >= 8 && iri <= 12) return "Rusak Ringan";
    return "Rusak Berat";
}

// 6. Menjalankan LCCA untuk Seluruh Segmen Jalan
function runLCCA(segments, roadParams, trafficParams, economicParams, treatmentParams) {
    // Hitung tingkat diskonto riil (Aproksimasi Fisher)
    const { i_nominal, inflation } = economicParams;
    const r_riil = i_nominal - inflation;
    const updatedEconomicParams = { ...economicParams, r_riil };

    const results = {
        r_riil,
        scenarios: {
            1: { name: "Skenario 1 (Preventif)", totalNPV: 0, segmentsData: [] },
            2: { name: "Skenario 2 (Reaktif)", totalNPV: 0, segmentsData: [] }
        }
    };

    // Proses untuk tiap Skenario (1, 2)
    for (let scenarioId = 1; scenarioId <= 2; scenarioId++) {
        let scenarioNPV = 0;
        const segmentsData = [];

        // Hitung proyeksi tahunan untuk tiap segmen jalan
        segments.forEach(seg => {
            const projections = projectIRIAndTreatments(
                seg.IRI_0,
                seg.CBR || roadParams.CBR, // Gunakan CBR segmen jika ada, jika tidak gunakan CBR global
                seg.SN || roadParams.SN,   // Gunakan SN segmen jika ada, jika tidak gunakan SN global
                roadParams,
                trafficParams,
                updatedEconomicParams,
                treatmentParams,
                scenarioId
            );

            // Hitung total NPV untuk segmen ini (Jumlah discounted cost tahun 1 s.d. 20)
            // Catatan: Tahun 0 tidak masuk discounted cost karena itu kondisi awal
            let segNPV = 0;
            const ur = trafficParams.UR || 20;
            for (let y = 1; y <= ur; y++) {
                segNPV += projections[y].discountedCost;
            }

            scenarioNPV += segNPV;

            segmentsData.push({
                segmentId: seg.id,
                segmentName: seg.name,
                projections: projections,
                npv: segNPV
            });
        });

        results.scenarios[scenarioId].totalNPV = scenarioNPV;
        results.scenarios[scenarioId].segmentsData = segmentsData;
    }

    return results;
}

// 7. Analisis Sensitivitas
// Menguji variasi suku bunga riil sebesar +-1% dan +-2% dari nilai baseline
function runSensitivityAnalysis(segments, roadParams, trafficParams, economicParams, treatmentParams) {
    const { i_nominal, inflation } = economicParams;
    const base_r = i_nominal - inflation;

    const variations = [-2, -1, 0, 1, 2]; // Variasi tingkat bunga riil delta (%)
    const sensitivityResults = [];

    variations.forEach(delta => {
        const test_r = base_r + delta;
        
        // Jalankan LCCA dengan tingkat diskonto riil buatan
        const testResults = {
            scenarios: { 1: 0, 2: 0 }
        };

        for (let sc = 1; sc <= 2; sc++) {
            let scNPV = 0;
            segments.forEach(seg => {
                const projections = projectIRIAndTreatments(
                    seg.IRI_0,
                    seg.CBR || roadParams.CBR,
                    seg.SN || roadParams.SN,
                    roadParams,
                    trafficParams,
                    { ...economicParams, r_riil: test_r },
                    treatmentParams,
                    sc
                );

                const ur = trafficParams.UR || 20;
                for (let y = 1; y <= ur; y++) {
                    scNPV += projections[y].discountedCost;
                }
            });
            testResults.scenarios[sc] = scNPV;
        }

        sensitivityResults.push({
            delta: delta,
            r_value: test_r,
            npv_sc1: testResults.scenarios[1],
            npv_sc2: testResults.scenarios[2]
        });
    });

    return sensitivityResults;
}
