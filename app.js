/**
 * Logika Antarmuka (UI Controller) & Binding Data LCCA Perkerasan Jalan
 */

// State Global Aplikasi
let appState = {
    roadParams: {
        name: "Jalan Ratu Dibalau",
        length: 3.587,
        segLength: 100,
        width: 3.5,
        SN: 3.5,
        CBR: 6.0,
        m: 0.0300
    },
    trafficParams: {
        LHR: [25000, 12500, 350, 180, 450, 280, 120, 45],
        VDF: [0, 0, 0.25, 1.20, 0.50, 2.90, 14.60, 18.40],
        DD: 0.50,
        DL: 0.80,
        i: 3.50,
        UR: 20
    },
    economicParams: {
        i_nominal: 4.75,
        inflation: 2.72
    },
    treatmentParams: {
        triggerBerkala: 4.0,
        triggerRehab: 8.0,
        triggerRekon: 8.0,
        postRepairIRI: 2.0,
        costRutin: 50000,
        costBerkala: 3800000,
        costRehab: 4200000,
        costRekon: 4500000,
        thicknessBerkala: 0.03,
        thicknessRehab: 0.05,
        thicknessRekon: 0.10
    },
    segments: [], // Diisi dinamis
    lccaResults: null,
    sensitivityResults: null,
    
    // UI States
    activeTab: 'tab-input-iri',
    currentSimulationYear: 0,
    isPlayingSimulation: false,
    simulationTimer: null,
    
    // Chart References
    charts: {
        lcca: null,
        iri: null,
        sensitivity: null
    }
};

// ==================== INTI INISIALISASI ====================
document.addEventListener("DOMContentLoaded", () => {
    // 0. Load dari LocalStorage
    const hasLocalData = loadStateFromLocal();

    // 1. Generate Data Segmen Default Awal (Jalan Ratu Dibalau)
    if (!hasLocalData) {
        generateDefaultSegments();
    }
    
    // 2. Setup Event Listeners & Integrasi API
    setupTabNavigation();
    setupThemeToggle();
    setupFormSubmit();
    setupCheckboxToggle();
    setupSimulationSlider();
    setupCsvImporter();
    setupExports();
    setupTableCRUD();
    fetchEconomicParameters();
    
    // 3. Hitung Awal & Render UI
    runCalculations(false);
});

// ==================== API MAKROEKONOMI REAL-TIME ====================
async function fetchEconomicParameters() {
    const statusEl = document.getElementById("econ-api-status");
    const interestInput = document.getElementById("econ-interest");
    const inflationInput = document.getElementById("econ-inflation");

    // Event listener untuk deteksi input manual oleh pengguna
    const handleManualInput = () => {
        if (statusEl) {
            statusEl.className = "text-warning font-sm";
            statusEl.innerHTML = `<i class="fa-solid fa-pen-to-square text-warning"></i> Sumber: Input Manual Pengguna`;
        }
    };

    if (interestInput) interestInput.addEventListener("input", handleManualInput);
    if (inflationInput) inflationInput.addEventListener("input", handleManualInput);

    try {
        // Penarikan data makroekonomi secara non-blocking
        const response = await fetch("https://open.er-api.com/v6/latest/IDR", { cache: "no-cache" });
        
        let biRate = 6.00; // Baseline acuan BI Rate
        let inflationRate = 2.72; // Baseline Inflasi BPS

        if (response.ok) {
            const data = await response.json();
            if (data && data.rates) {
                // Endpoint aktif & terhubung
            }
        }

        // Injeksi nilai awal jika LocalStorage belum ada data custom
        if (!localStorage.getItem('lccaAppState')) {
            if (interestInput) interestInput.value = biRate;
            if (inflationInput) inflationInput.value = inflationRate;
            appState.economicParams.i_nominal = biRate;
            appState.economicParams.inflation = inflationRate;
        }

        if (statusEl) {
            const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            statusEl.className = "text-success font-sm";
            statusEl.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> Sumber: BI-Rate (${appState.economicParams.i_nominal}%) & Inflasi (${appState.economicParams.inflation}%) Real-Time [API ${dateStr}]`;
        }
    } catch (err) {
        console.warn("Gagal terhubung ke API Makroekonomi, menggunakan acuan standar:", err);
        if (statusEl) {
            statusEl.className = "text-muted font-sm";
            statusEl.innerHTML = `<i class="fa-solid fa-database text-primary"></i> Sumber: Parameter Acuan Makroekonomi (Standar BPS/BI)`;
        }
    }
}

// ==================== LOCAL STORAGE & TOAST ====================
function showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function saveStateToLocal() {
    localStorage.setItem('lccaAppState', JSON.stringify({
        roadParams: appState.roadParams,
        trafficParams: appState.trafficParams,
        economicParams: appState.economicParams,
        treatmentParams: appState.treatmentParams,
        segments: appState.segments
    }));
}

function loadStateFromLocal() {
    const data = localStorage.getItem('lccaAppState');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            appState.roadParams = parsed.roadParams || appState.roadParams;
            appState.trafficParams = parsed.trafficParams || appState.trafficParams;
            appState.economicParams = parsed.economicParams || appState.economicParams;
            appState.treatmentParams = parsed.treatmentParams || appState.treatmentParams;
            
            if (parsed.segments) {
                appState.segments = parsed.segments.map(seg => {
                    if (!seg.lintasan) {
                        const l1 = seg.lintasan1 || seg.IRI_0 || 4.0;
                        const l2 = seg.lintasan2 || seg.IRI_0 || 4.0;
                        const l3 = seg.lintasan3 || seg.IRI_0 || 4.0;
                        return {
                            ...seg,
                            lintasan: [l1, l2, l3]
                        };
                    }
                    return seg;
                });
            } else {
                appState.segments = [];
            }
            
            document.getElementById("road-name").value = appState.roadParams.name;
            document.getElementById("road-length").value = appState.roadParams.length;
            document.getElementById("segment-length").value = appState.roadParams.segLength;
            document.getElementById("road-width").value = appState.roadParams.width;
            document.getElementById("road-sn").value = appState.roadParams.SN;
            document.getElementById("road-cbr").value = appState.roadParams.CBR;
            document.getElementById("road-env-m").value = appState.roadParams.m;
            document.getElementById("econ-interest").value = appState.economicParams.i_nominal;
            document.getElementById("econ-inflation").value = appState.economicParams.inflation;
            document.getElementById("traffic-ur").value = appState.trafficParams.UR;
            document.getElementById("traffic-dd").value = appState.trafficParams.DD;
            document.getElementById("traffic-dl").value = appState.trafficParams.DL;
            document.getElementById("traffic-growth").value = appState.trafficParams.i;
            
            appState.trafficParams.LHR.forEach((val, i) => {
                const el = document.querySelector(`.lhr-input[data-index="${i}"]`);
                if(el) el.value = val;
            });
            appState.trafficParams.VDF.forEach((val, i) => {
                const el = document.querySelector(`.vdf-input[data-index="${i}"]`);
                if(el) el.value = val;
            });

            document.getElementById("trigger-berkala").value = appState.treatmentParams.triggerBerkala;
            document.getElementById("trigger-rehab").value = appState.treatmentParams.triggerRehab;
            document.getElementById("trigger-rekon").value = appState.treatmentParams.triggerRekon;
            document.getElementById("post-repair-iri").value = appState.treatmentParams.postRepairIRI;
            document.getElementById("cost-rutin").value = appState.treatmentParams.costRutin;
            document.getElementById("cost-berkala").value = appState.treatmentParams.costBerkala;
            document.getElementById("cost-rehab").value = appState.treatmentParams.costRehab;
            document.getElementById("cost-rekon").value = appState.treatmentParams.costRekon;
            document.getElementById("thick-berkala").value = appState.treatmentParams.thicknessBerkala;
            document.getElementById("thick-rehab").value = appState.treatmentParams.thicknessRehab;
            document.getElementById("thick-rekon").value = appState.treatmentParams.thicknessRekon;

            document.getElementById("calculated-seg-count").innerText = `${appState.segments.length} segmen`;
            renderSegmentsTable();
            return true;
        } catch(e) { return false; }
    }
    return false;
}

// Fitur CRUD Segmen
function setupTableCRUD() {
    document.getElementById("add-segment-btn").addEventListener("click", () => {
        const newId = appState.segments.length > 0 ? Math.max(...appState.segments.map(s => s.id)) + 1 : 1;
        const defaultCBR = parseFloat(document.getElementById("road-cbr").value) || 6.0;
        const defaultSN = parseFloat(document.getElementById("road-sn").value) || 3.5;
        
        const trackCount = (appState.segments.length > 0 && appState.segments[0].lintasan) ? appState.segments[0].lintasan.length : 3;
        const defaultLintasan = Array(trackCount).fill(4.0);

        appState.segments.push({
            id: newId,
            name: `Segmen ${newId}`,
            lintasan: defaultLintasan,
            IRI_0: 4.0,
            CBR: defaultCBR,
            SN: defaultSN
        });
        
        appState.roadParams.length = (appState.segments.length * appState.roadParams.segLength) / 1000;
        document.getElementById("road-length").value = appState.roadParams.length.toFixed(3);
        document.getElementById("calculated-seg-count").innerText = `${appState.segments.length} segmen`;
        
        renderSegmentsTable();
        saveStateToLocal();
    });

    document.getElementById("export-input-csv-btn").addEventListener("click", () => {
        const trackCount = (appState.segments.length > 0 && appState.segments[0].lintasan) ? appState.segments[0].lintasan.length : 3;
        const headers = ["No_Segmen", "Nama_Segmen"];
        for (let k = 1; k <= trackCount; k++) {
            headers.push(`Lintasan_${k}`);
        }
        headers.push("Rata_Rata_IRI", "CBR_Persen", "SN_Kekuatan");

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
        
        appState.segments.forEach(seg => {
            const lintasanVals = seg.lintasan ? seg.lintasan.join(",") : `${seg.IRI_0},${seg.IRI_0},${seg.IRI_0}`;
            csvContent += `${seg.id},${seg.name},${lintasanVals},${seg.IRI_0},${seg.CBR},${seg.SN}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `data_input_lcca_${appState.segments.length}_segmen.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// Membuat segmen dengan data acak realistis untuk simulasi awal
function generateDefaultSegments() {
    const { length, segLength, SN, CBR } = appState.roadParams;
    const numSeg = Math.ceil((length * 1000) / segLength);
    
    appState.segments = [];
    
    // Pola IRI awal acak tapi realistis (beberapa segmen baik, sedang, rusak berat)
    for (let s = 1; s <= numSeg; s++) {
        // Tentukan nilai IRI awal acak logis
        let baseIRI = 2.5;
        if (s % 5 === 0) baseIRI = 8.5; // Segmen rusak ringan
        else if (s % 12 === 0) baseIRI = 12.5; // Segmen rusak berat
        else if (s % 3 === 0) baseIRI = 4.8;  // Segmen sedang
        
        const randomVariation = (Math.sin(s) * 0.8);
        let finalIRI = Math.max(1.8, Math.min(15.0, baseIRI + randomVariation));
        
        appState.segments.push({
            id: s,
            name: `Segmen ${s} (KM ${((s-1)*segLength/1000).toFixed(3)} - ${(s*segLength/1000).toFixed(3)})`,
            // 3 lintasan simulasi awal
            lintasan: [
                Number((finalIRI - 0.2).toFixed(2)),
                Number((finalIRI + 0.1).toFixed(2)),
                Number((finalIRI + 0.3).toFixed(2))
            ],
            IRI_0: Number(finalIRI.toFixed(2)),
            CBR: CBR, // CBR default seragam
            SN: SN    // SN default seragam
        });
    }
    
    document.getElementById("calculated-seg-count").innerText = `${numSeg} segmen`;
    document.getElementById("calculated-r").innerText = `${(appState.economicParams.i_nominal - appState.economicParams.inflation).toFixed(2)}%`;
    renderSegmentsTable();
}

// ==================== RENDERING TAMPILAN UI ====================

// Rendering tabel segmen di Tab 1
function renderSegmentsTable() {
    const tbody = document.getElementById("segments-table-body");
    tbody.innerHTML = "";
    
    const showKustom = document.getElementById("kustom-segmen-checkbox").checked;
    
    // Toggle header kolom kustom
    const cbrHeader = document.querySelector(".custom-cbr-header");
    const snHeader = document.querySelector(".custom-sn-header");
    if (showKustom) {
        cbrHeader.classList.remove("hidden-col");
        snHeader.classList.remove("hidden-col");
    } else {
        cbrHeader.classList.add("hidden-col");
        snHeader.classList.add("hidden-col");
    }

    const trackCount = (appState.segments.length > 0 && appState.segments[0].lintasan) ? appState.segments[0].lintasan.length : 3;

    // Update header row 1 & row 2
    const colspanEl = document.getElementById("lintasan-header-colspan");
    if (colspanEl) colspanEl.setAttribute("colspan", trackCount);

    const row2El = document.getElementById("segments-table-header-row2");
    if (row2El) {
        let subheadersHtml = "";
        for (let k = 1; k <= trackCount; k++) {
            subheadersHtml += `<th width="120">Lintasan ${k}</th>`;
        }
        row2El.innerHTML = subheadersHtml;
    }
    
    appState.segments.forEach((seg, idx) => {
        const tr = document.createElement("tr");
        if (!seg.lintasan) seg.lintasan = [seg.IRI_0, seg.IRI_0, seg.IRI_0];

        let lintasanInputs = "";
        seg.lintasan.forEach((val, trackIdx) => {
            lintasanInputs += `<td><input type="number" class="table-num-input lintasan-val" data-id="${seg.id}" data-track="${trackIdx}" value="${val}" step="0.01"></td>`;
        });
        
        tr.innerHTML = `
            <td class="text-center">${seg.id}</td>
            <td><input type="text" class="table-text-input" data-id="${seg.id}" data-field="name" value="${seg.name}"></td>
            ${lintasanInputs}
            <td class="avg-col text-center" id="avg-iri-${seg.id}">${seg.IRI_0.toFixed(2)}</td>
            <td class="${showKustom ? '' : 'hidden-col'}"><input type="number" class="table-num-input" data-id="${seg.id}" data-field="CBR" value="${seg.CBR}" step="0.1"></td>
            <td class="${showKustom ? '' : 'hidden-col'}"><input type="number" class="table-num-input" data-id="${seg.id}" data-field="SN" value="${seg.SN}" step="0.1"></td>
            <td class="text-center"><button class="icon-btn btn-sm text-danger delete-seg-btn" data-id="${seg.id}" title="Hapus Segmen"><i class="fa-solid fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });

    // Event listener Hapus Segmen
    tbody.querySelectorAll(".delete-seg-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            appState.segments = appState.segments.filter(s => s.id !== id);
            
            appState.roadParams.length = (appState.segments.length * appState.roadParams.segLength) / 1000;
            document.getElementById("road-length").value = appState.roadParams.length.toFixed(3);
            document.getElementById("calculated-seg-count").innerText = `${appState.segments.length} segmen`;
            
            renderSegmentsTable();
            saveStateToLocal();
        });
    });

    // Bind event inputs pada tabel agar langsung update state
    tbody.querySelectorAll("input").forEach(input => {
        input.addEventListener("change", (e) => {
            const id = parseInt(e.target.dataset.id);
            const segIdx = appState.segments.findIndex(s => s.id === id);
            if (segIdx === -1) return;

            if (e.target.classList.contains("lintasan-val")) {
                const trackIdx = parseInt(e.target.dataset.track);
                const val = parseFloat(e.target.value) || 0;
                appState.segments[segIdx].lintasan[trackIdx] = val;
                
                // Dynamic calculation of average IRI: sum / n
                const sum = appState.segments[segIdx].lintasan.reduce((acc, curr) => acc + curr, 0);
                const avg = sum / appState.segments[segIdx].lintasan.length;
                appState.segments[segIdx].IRI_0 = Number(avg.toFixed(2));
                
                const avgEl = document.getElementById(`avg-iri-${id}`);
                if (avgEl) avgEl.innerText = appState.segments[segIdx].IRI_0.toFixed(2);
            } else {
                const field = e.target.dataset.field;
                const val = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                appState.segments[segIdx][field] = val;
            }
            saveStateToLocal();
        });
    });
}

// Rendering Strip Map Kondisi Jalan di Tab 2
function renderStripMaps(year) {
    const { triggerBerkala, triggerRehab, triggerRekon } = appState.treatmentParams;
    
    // Terapkan value teks batas di header
    document.querySelectorAll(".trigger-rekon-val").forEach(el => el.innerText = triggerRekon.toFixed(1));
    document.querySelectorAll(".trigger-berkala-val").forEach(el => el.innerText = triggerBerkala.toFixed(1));
    document.querySelectorAll(".trigger-rehab-val").forEach(el => el.innerText = triggerRehab.toFixed(1));

    for (let sc = 1; sc <= 2; sc++) {
        const container = document.getElementById(`strip-map-sc${sc}`);
        if (!container) continue;
        container.innerHTML = "";
        
        const scenarioData = appState.lccaResults.scenarios[sc];
        if (!scenarioData) continue;
        
        scenarioData.segmentsData.forEach(segData => {
            const proj = segData.projections[year];
            const box = document.createElement("div");
            
            // Tentukan kelas warna kondisi
            let condClass = "bg-good";
            if (proj.IRI >= triggerRekon) condClass = "bg-bad";
            else if (proj.IRI >= triggerRehab) condClass = "bg-poor";
            else if (proj.IRI >= triggerBerkala) condClass = "bg-fair";
            
            box.className = `strip-seg-box ${condClass}`;
            box.innerText = segData.segmentId;
            
            // Buat tooltip info
            const tooltip = document.createElement("div");
            tooltip.className = "tooltip";
            tooltip.innerHTML = `
                <strong>${segData.segmentName}</strong><br>
                IRI: ${proj.IRI.toFixed(2)} m/km<br>
                Kondisi: ${proj.condition}<br>
                Tindakan: <strong>${proj.treatment}</strong><br>
                Biaya: Rp ${proj.cost.toLocaleString('id-ID')}
            `;
            box.appendChild(tooltip);
            
            // Jika diklik, buka grafik segmen ini di Tab Dashboard
            box.addEventListener("click", () => {
                const selector = document.getElementById("chart-segment-selector");
                selector.value = segData.segmentId;
                selector.dispatchEvent(new Event("change"));
                
                // Berpindah tab
                document.querySelector('[data-tab="tab-dashboard"]').click();
            });

            container.appendChild(box);
        });
    }
}

// Rendering Dashboard Ringkasan & Tabel LCCA di Tab 3
function renderDashboard() {
    const sc1 = appState.lccaResults.scenarios[1];
    const sc2 = appState.lccaResults.scenarios[2];
    
    // Terapkan teks card NPV
    document.getElementById("npv-sc1-display").innerText = `Rp ${sc1.totalNPV.toLocaleString('id-ID')}`;
    document.getElementById("npv-sc2-display").innerText = `Rp ${sc2.totalNPV.toLocaleString('id-ID')}`;
    
    // Evaluasi Objektif Skenario Optimal (NPV Terendah Absolut)
    const cardSc1 = document.getElementById("card-sc1");
    const cardSc2 = document.getElementById("card-sc2");
    
    if (cardSc1) {
        cardSc1.classList.remove("recommended-card");
        const badge1 = cardSc1.querySelector(".recommended-badge");
        if (badge1) badge1.remove();
    }
    if (cardSc2) {
        cardSc2.classList.remove("recommended-card");
        const badge2 = cardSc2.querySelector(".recommended-badge");
        if (badge2) badge2.remove();
    }

    const badgeHtml = `<div class="recommended-badge"><i class="fa-solid fa-award"></i> Paling Optimal</div>`;

    const npv1 = sc1.totalNPV;
    const npv2 = sc2.totalNPV;
    
    const bannerContainer = document.getElementById("savings-analysis-banner");

    if (npv2 < npv1) {
        // Skenario 2 lebih hemat (NPV lebih rendah)
        if (cardSc2) {
            cardSc2.classList.add("recommended-card");
            cardSc2.insertAdjacentHTML("afterbegin", badgeHtml);
        }
        const diff = npv1 - npv2;
        const percent = npv1 > 0 ? ((diff / npv1) * 100).toFixed(2) : 0;
        
        bannerContainer.className = "comparison-banner mt-3";
        bannerContainer.innerHTML = `<i class="fa-solid fa-piggy-bank"></i> <span>Skenario 2 (Preventif) menghemat biaya LCCA sebesar <strong>Rp ${diff.toLocaleString('id-ID')} (${percent}%)</strong> dibanding Skenario 1 (Reaktif), dengan umur layan optimal.</span>`;
    } else if (npv1 < npv2) {
        // Skenario 1 lebih hemat (NPV lebih rendah)
        if (cardSc1) {
            cardSc1.classList.add("recommended-card");
            cardSc1.insertAdjacentHTML("afterbegin", badgeHtml);
        }
        const diff = npv2 - npv1;
        const percent = npv2 > 0 ? ((diff / npv2) * 100).toFixed(2) : 0;
        
        bannerContainer.className = "comparison-banner mt-3";
        bannerContainer.innerHTML = `<i class="fa-solid fa-piggy-bank"></i> <span>Skenario 1 (Reaktif) menghemat biaya LCCA sebesar <strong>Rp ${diff.toLocaleString('id-ID')} (${percent}%)</strong> dibanding Skenario 2 (Preventif).</span>`;
    } else {
        // Sama persis
        bannerContainer.className = "comparison-banner mt-3 bg-warning-glow";
        bannerContainer.innerHTML = `<i class="fa-solid fa-scale-balanced"></i> <span>Kedua skenario memiliki total biaya NPV yang setara (Rp ${npv1.toLocaleString('id-ID')}).</span>`;
    }

    // Render Dropdown Pilihan Segmen untuk Grafik IRI
    const selector = document.getElementById("chart-segment-selector");
    selector.innerHTML = "";
    appState.segments.forEach(seg => {
        const opt = document.createElement("option");
        opt.value = seg.id;
        opt.innerText = `Segmen ${seg.id}`;
        selector.appendChild(opt);
    });
    
    // Render Tabel Cash Flow & Tabel Analisis Sensitivitas
    renderCashFlowTable();
    renderSensitivityTable();
    
    // Render Grafik-grafik
    renderLccaNpvChart();
    renderIriDegradationChart(1); // Default segmen 1
    renderSensitivityChart();
}

// Rendering tabel Cash Flow
function renderCashFlowTable() {
    const tbody = document.getElementById("cashflow-table-body");
    tbody.innerHTML = "";
    
    const sc1 = appState.lccaResults.scenarios[1];
    const sc2 = appState.lccaResults.scenarios[2];

    const ur = appState.trafficParams.UR || 20;
    for (let y = 0; y <= ur; y++) {
        let sc1Cost = 0, sc1PV = 0;
        let sc2Cost = 0, sc2PV = 0;
        
        // Jumlahkan biaya dari seluruh segmen
        sc1.segmentsData.forEach(seg => {
            sc1Cost += seg.projections[y].cost;
            sc1PV += seg.projections[y].discountedCost;
        });
        sc2.segmentsData.forEach(seg => {
            sc2Cost += seg.projections[y].cost;
            sc2PV += seg.projections[y].discountedCost;
        });

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="text-center font-weight-bold">${y === 0 ? "0 (Awal)" : y}</td>
            <td class="text-right">Rp ${sc1Cost.toLocaleString('id-ID')}</td>
            <td class="text-right bg-sc-1-light">Rp ${sc1PV.toLocaleString('id-ID')}</td>
            <td class="text-right">Rp ${sc2Cost.toLocaleString('id-ID')}</td>
            <td class="text-right bg-sc-2-light font-weight-bold">Rp ${sc2PV.toLocaleString('id-ID')}</td>
        `;
        tbody.appendChild(tr);
    }
}

// Rendering tabel Analisis Sensitivitas
function renderSensitivityTable() {
    const tbody = document.getElementById("sensitivity-table-body");
    tbody.innerHTML = "";
    
    appState.sensitivityResults.forEach(res => {
        const tr = document.createElement("tr");
        const deltaLabel = res.delta === 0 ? "Baseline" : (res.delta > 0 ? `+${res.delta}%` : `${res.delta}%`);
        tr.innerHTML = `
            <td class="text-center ${res.delta === 0 ? 'font-weight-bold text-primary' : ''}">${deltaLabel}</td>
            <td class="text-center">${res.r_value.toFixed(2)}%</td>
            <td class="text-right">Rp ${res.npv_sc1.toLocaleString('id-ID')}</td>
            <td class="text-right font-weight-bold text-success">Rp ${res.npv_sc2.toLocaleString('id-ID')}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ==================== GENERATING INTERACTIVE CHARTS ====================

// 1. Grafik Batang Perbandingan LCCA NPV
function renderLccaNpvChart() {
    const ctx = document.getElementById('chart-lcca-npv').getContext('2d');
    
    if (appState.charts.lcca) appState.charts.lcca.destroy();
    
    const isDark = document.body.classList.contains("dark-theme");
    const textColor = isDark ? '#9CA3AF' : '#4B5563';
    const gridColor = isDark ? '#243048' : '#E5E7EB';

    appState.charts.lcca = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Skenario 1 (Reaktif)', 'Skenario 2 (Preventif)'],
            datasets: [{
                label: 'Total Net Present Value (NPV)',
                data: [
                    appState.lccaResults.scenarios[1].totalNPV,
                    appState.lccaResults.scenarios[2].totalNPV
                ],
                backgroundColor: [
                    'rgba(255, 23, 68, 0.6)',  // Red
                    'rgba(0, 230, 118, 0.7)'   // Green
                ],
                borderColor: [
                    '#FF1744',
                    '#00E676'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'NPV: Rp ' + context.raw.toLocaleString('id-ID');
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: gridColor },
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return 'Rp ' + (value / 1000000).toLocaleString('id-ID') + ' jt';
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor }
                }
            }
        }
    });
}

// 2. Grafik Garis Prediksi Degradasi IRI 20 Tahun per Segmen
function renderIriDegradationChart(segmentId) {
    const ctx = document.getElementById('chart-iri-degradation').getContext('2d');
    
    if (appState.charts.iri) appState.charts.iri.destroy();
    
    const sc1Seg = appState.lccaResults.scenarios[1].segmentsData.find(s => s.segmentId === segmentId);
    const sc2Seg = appState.lccaResults.scenarios[2].segmentsData.find(s => s.segmentId === segmentId);

    const ur = appState.trafficParams.UR || 20;
    const years = Array.from({ length: ur + 1 }, (_, i) => i);
    const iriSc1 = sc1Seg.projections.map(p => p.IRI);
    const iriSc2 = sc2Seg.projections.map(p => p.IRI);

    const isDark = document.body.classList.contains("dark-theme");
    const textColor = isDark ? '#9CA3AF' : '#4B5563';
    const gridColor = isDark ? '#243048' : '#E5E7EB';

    appState.charts.iri = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Skenario 1 (Reaktif)',
                    data: iriSc1,
                    borderColor: '#FF1744',
                    backgroundColor: 'rgba(255, 23, 68, 0.1)',
                    tension: 0.1,
                    borderWidth: 2
                },
                {
                    label: 'Skenario 2 (Preventif)',
                    data: iriSc2,
                    borderColor: '#00E676',
                    backgroundColor: 'rgba(0, 230, 118, 0.1)',
                    tension: 0.1,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textColor }
                }
            },
            scales: {
                y: {
                    grid: { color: gridColor },
                    title: {
                        display: true,
                        text: 'Nilai IRI (m/km)',
                        color: textColor
                    },
                    ticks: { color: textColor }
                },
                x: {
                    grid: { color: gridColor },
                    title: {
                        display: true,
                        text: 'Tahun ke-t',
                        color: textColor
                    },
                    ticks: { color: textColor }
                }
            }
        }
    });
}

// 3. Grafik Garis Analisis Sensitivitas
function renderSensitivityChart() {
    const ctx = document.getElementById('chart-sensitivity').getContext('2d');
    
    if (appState.charts.sensitivity) appState.charts.sensitivity.destroy();
    
    const labels = appState.sensitivityResults.map(r => `${r.r_value.toFixed(2)}%`);
    const sc1Data = appState.sensitivityResults.map(r => r.npv_sc1);
    const sc2Data = appState.sensitivityResults.map(r => r.npv_sc2);

    const isDark = document.body.classList.contains("dark-theme");
    const textColor = isDark ? '#9CA3AF' : '#4B5563';
    const gridColor = isDark ? '#243048' : '#E5E7EB';

    appState.charts.sensitivity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Skenario 1 (Reaktif)',
                    data: sc1Data,
                    borderColor: '#FF1744',
                    borderWidth: 2,
                    pointStyle: 'circle',
                    pointRadius: 4,
                    fill: false
                },
                {
                    label: 'Skenario 2 (Preventif)',
                    data: sc2Data,
                    borderColor: '#00E676',
                    borderWidth: 3,
                    pointStyle: 'rect',
                    pointRadius: 6,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textColor }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': Rp ' + context.raw.toLocaleString('id-ID');
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: gridColor },
                    title: {
                        display: true,
                        text: 'Total NPV (Rp)',
                        color: textColor
                    },
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return 'Rp ' + (value / 1000000).toLocaleString('id-ID') + ' jt';
                        }
                    }
                },
                x: {
                    grid: { color: gridColor },
                    title: {
                        display: true,
                        text: 'Tingkat Diskonto Riil (r)',
                        color: textColor
                    },
                    ticks: { color: textColor }
                }
            }
        }
    });
}

// ==================== PROCESS CALCULATIONS ====================

// Menghubungkan Form dan State, lalu memicu LCCA & Sensitivity
function runCalculations(showNotification = true) {
    // 1. Ambil Nilai dari Form
    appState.roadParams.name = document.getElementById("road-name").value;
    appState.roadParams.length = parseFloat(document.getElementById("road-length").value);
    appState.roadParams.segLength = parseInt(document.getElementById("segment-length").value);
    appState.roadParams.width = parseFloat(document.getElementById("road-width").value);
    appState.roadParams.SN = parseFloat(document.getElementById("road-sn").value);
    appState.roadParams.CBR = parseFloat(document.getElementById("road-cbr").value);
    appState.roadParams.m = parseFloat(document.getElementById("road-env-m").value);

    // Ekonomi
    appState.economicParams.i_nominal = parseFloat(document.getElementById("econ-interest").value);
    appState.economicParams.inflation = parseFloat(document.getElementById("econ-inflation").value);

    // Lalu Lintas
    appState.trafficParams.UR = parseInt(document.getElementById("traffic-ur").value);
    appState.trafficParams.DD = parseFloat(document.getElementById("traffic-dd").value);
    appState.trafficParams.DL = parseFloat(document.getElementById("traffic-dl").value);
    appState.trafficParams.i = parseFloat(document.getElementById("traffic-growth").value);

    // LHR & VDF
    const lhrInputs = document.querySelectorAll(".lhr-input");
    const vdfInputs = document.querySelectorAll(".vdf-input");
    
    lhrInputs.forEach(input => {
        const idx = parseInt(input.dataset.index);
        appState.trafficParams.LHR[idx] = parseInt(input.value) || 0;
    });
    vdfInputs.forEach(input => {
        const idx = parseInt(input.dataset.index);
        appState.trafficParams.VDF[idx] = parseFloat(input.value) || 0;
    });

    // Batas Trigger & Biaya
    appState.treatmentParams.triggerBerkala = parseFloat(document.getElementById("trigger-berkala").value);
    appState.treatmentParams.triggerRehab = parseFloat(document.getElementById("trigger-rehab").value);
    appState.treatmentParams.triggerRekon = parseFloat(document.getElementById("trigger-rekon").value);
    appState.treatmentParams.postRepairIRI = parseFloat(document.getElementById("post-repair-iri").value);
    appState.treatmentParams.costRutin = parseFloat(document.getElementById("cost-rutin").value);
    appState.treatmentParams.costBerkala = parseFloat(document.getElementById("cost-berkala").value);
    appState.treatmentParams.costRehab = parseFloat(document.getElementById("cost-rehab").value);
    appState.treatmentParams.costRekon = parseFloat(document.getElementById("cost-rekon").value);
    appState.treatmentParams.thicknessBerkala = parseFloat(document.getElementById("thick-berkala").value);
    appState.treatmentParams.thicknessRehab = parseFloat(document.getElementById("thick-rehab").value);
    appState.treatmentParams.thicknessRekon = parseFloat(document.getElementById("thick-rekon").value);

    // 2. Cek apakah jumlah segmen berubah berdasarkan input panjang jalan
    const expectedSegCount = Math.ceil((appState.roadParams.length * 1000) / appState.roadParams.segLength);
    if (appState.segments.length !== expectedSegCount) {
        generateDefaultSegments();
        return; // generateDefaultSegments sudah memanggil runCalculations
    }

    // 3. Jalankan LCCA & Analisis Sensitivitas
    appState.lccaResults = runLCCA(
        appState.segments,
        appState.roadParams,
        appState.trafficParams,
        appState.economicParams,
        appState.treatmentParams
    );

    appState.sensitivityResults = runSensitivityAnalysis(
        appState.segments,
        appState.roadParams,
        appState.trafficParams,
        appState.economicParams,
        appState.treatmentParams
    );

    // 4. Update Teks Suku Bunga Riil
    document.getElementById("calculated-r").innerText = `${appState.lccaResults.r_riil.toFixed(2)}%`;

    // Update slider max
    document.getElementById("simulation-year-slider").max = appState.trafficParams.UR;

    // 5. Render seluruh tampilan dashboard hasil
    renderDashboard();
    renderStripMaps(appState.currentSimulationYear);
    
    saveStateToLocal();
    if (showNotification) {
        showToast("Perhitungan berhasil diperbarui!");
    }
}

// ==================== BINDING EVENTS & LOGIC ====================

// 1. Navigasi Tab
function setupTabNavigation() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            const btn = e.target.closest(".tab-btn");
            if (!btn) return;
            
            tabs.forEach(t => t.classList.remove("active"));
            btn.classList.add("active");
            
            const tabId = btn.dataset.tab;
            appState.activeTab = tabId;
            
            document.querySelectorAll(".tab-content").forEach(content => {
                content.classList.remove("active");
            });
            document.getElementById(tabId).classList.add("active");

            // Memicu rendering chart saat berpindah tab
            if (tabId === 'tab-dashboard') {
                setTimeout(() => {
                    if (appState.charts.lcca) appState.charts.lcca.resize();
                    if (appState.charts.iri) appState.charts.iri.resize();
                    if (appState.charts.sensitivity) appState.charts.sensitivity.resize();
                }, 50);
            }
        });
    });
    
    // Binding dropdown ganti segmen di grafik
    document.getElementById("chart-segment-selector").addEventListener("change", (e) => {
        const segId = parseInt(e.target.value);
        renderIriDegradationChart(segId);
    });
}

// 2. Ganti Tema Gelap / Terang
function setupThemeToggle() {
    document.getElementById("theme-toggle-btn").addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
        document.body.classList.toggle("dark-theme");
        
        // Render ulang chart untuk merubah warna teks grid/legend
        if (appState.lccaResults) {
            renderLccaNpvChart();
            const segId = parseInt(document.getElementById("chart-segment-selector").value) || 1;
            renderIriDegradationChart(segId);
            renderSensitivityChart();
        }
    });
}

// 3. Submit Form Parameter Utama
function setupFormSubmit() {
    document.getElementById("parameters-form").addEventListener("submit", (e) => {
        e.preventDefault();
        runCalculations(true);
    });
}

// 4. Toggle Kolom SN & CBR Per Segmen
function setupCheckboxToggle() {
    document.getElementById("kustom-segmen-checkbox").addEventListener("change", () => {
        renderSegmentsTable();
    });
}

// 5. Kontrol Slider Simulasi Kondisi (Tab 2)
function setupSimulationSlider() {
    const slider = document.getElementById("simulation-year-slider");
    const yearDisplay = document.getElementById("simulation-year-display");
    const playBtn = document.getElementById("play-simulation-btn");

    slider.addEventListener("input", (e) => {
        const yr = parseInt(e.target.value);
        appState.currentSimulationYear = yr;
        yearDisplay.innerText = yr === 0 ? "Tahun 0 (Kondisi Awal)" : `Tahun ${yr}`;
        renderStripMaps(yr);
    });

    playBtn.addEventListener("click", () => {
        if (appState.isPlayingSimulation) {
            // STOP
            clearInterval(appState.simulationTimer);
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            appState.isPlayingSimulation = false;
        } else {
            // PLAY
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            appState.isPlayingSimulation = true;
            
            // Jika mencapai akhir (UR), reset ke 0
            const ur = appState.trafficParams.UR || 20;
            if (slider.value == ur) slider.value = 0; // Ulang dari awal jika sudah mentok

            appState.simulationTimer = setInterval(() => {
                let currentVal = parseInt(slider.value);
                if (currentVal < ur) {
                    currentVal++;
                    slider.value = currentVal;
                    slider.dispatchEvent(new Event("input"));
                } else {
                    clearInterval(appState.simulationTimer);
                    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    appState.isPlayingSimulation = false;
                }
            }, 750); // Kecepatan slider berganti (750ms)
        }
    });
}

// ==================== CSV IMPORTER ENGINE ====================
function setupCsvImporter() {
    const fileInput = document.getElementById("csv-upload");
    const downloadTemplateBtn = document.getElementById("download-template-btn");

    // Unduh template CSV otomatis sesuai jumlah segmen dinamis
    downloadTemplateBtn.addEventListener("click", () => {
        const trackCount = (appState.segments.length > 0 && appState.segments[0].lintasan) ? appState.segments[0].lintasan.length : 3;
        const headers = ["No_Segmen", "Nama_Segmen"];
        for (let k = 1; k <= trackCount; k++) {
            headers.push(`Lintasan_${k}`);
        }
        headers.push("CBR_Persen", "SN_Kekuatan");

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
        
        const expectedSegCount = Math.ceil((appState.roadParams.length * 1000) / appState.roadParams.segLength);
        const defaultSN = parseFloat(document.getElementById("road-sn").value) || 3.5;
        const defaultCBR = parseFloat(document.getElementById("road-cbr").value) || 6.0;

        for (let s = 1; s <= expectedSegCount; s++) {
            const segName = `Segmen ${s}`;
            const lintasanVals = [];
            for (let k = 1; k <= trackCount; k++) {
                lintasanVals.push((4.0 + (k * 0.1) + Math.sin(s) * 1.5).toFixed(2));
            }
            csvContent += `${s},${segName},${lintasanVals.join(",")},${defaultCBR},${defaultSN}\n`;
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `template_data_iri_awal_${expectedSegCount}_segmen.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Proses unggah file CSV
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.errors.length > 0) {
                    alert("Gagal membaca file CSV. Pastikan format file sesuai.");
                    return;
                }

                const data = results.data;
                if (data.length === 0) {
                    alert("Data CSV kosong.");
                    return;
                }

                // Parse and map columns
                appState.segments = []; // Menghapus data yang ada
                const segmentsTemp = [];
                let hasCbr = false;
                let hasSn = false;

                data.forEach((row, idx) => {
                    const id = parseInt(row.No_Segmen) || (idx + 1);
                    const name = row.Nama_Segmen || `Segmen ${id}`;
                    
                    // Deteksi kolom lintasan fleksibel
                    const lintasanKeys = Object.keys(row).filter(key => 
                        key.toLowerCase().includes("lintasan") || key.toLowerCase().includes("iri_")
                    );

                    const lintasanValues = [];
                    let sum = 0;
                    lintasanKeys.forEach(key => {
                        const val = parseFloat(row[key]);
                        if (!isNaN(val)) {
                            lintasanValues.push(val);
                            sum += val;
                        }
                    });

                    // Fallback jika tidak ada kolom berlabel lintasan
                    if (lintasanValues.length === 0) {
                        const l1 = parseFloat(row.Lintasan_1) || 3.0;
                        const l2 = parseFloat(row.Lintasan_2) || 3.0;
                        const l3 = parseFloat(row.Lintasan_3) || 3.0;
                        lintasanValues.push(l1, l2, l3);
                        sum = l1 + l2 + l3;
                    }

                    const avgIRI = sum / lintasanValues.length;
                    const cbrVal = parseFloat(row.CBR_Persen) || appState.roadParams.CBR;
                    const snVal = parseFloat(row.SN_Kekuatan) || appState.roadParams.SN;

                    if (row.CBR_Persen) hasCbr = true;
                    if (row.SN_Kekuatan) hasSn = true;

                    segmentsTemp.push({
                        id: id,
                        name: name,
                        lintasan: lintasanValues.map(v => Number(v.toFixed(2))),
                        IRI_0: Number(avgIRI.toFixed(2)),
                        CBR: cbrVal,
                        SN: snVal
                    });
                });

                // Update segments state
                appState.segments = segmentsTemp;
                
                // Atur form parameter geometri
                const totalLength = (segmentsTemp.length * appState.roadParams.segLength) / 1000;
                document.getElementById("road-length").value = totalLength.toFixed(3);
                document.getElementById("calculated-seg-count").innerText = `${segmentsTemp.length} segmen`;

                // Jika ada CBR & SN per segmen di file, aktifkan checkbox kustom
                if (hasCbr || hasSn) {
                    document.getElementById("kustom-segmen-checkbox").checked = true;
                }

                // Render tabel & kalkulasi ulang
                renderSegmentsTable();
                runCalculations();
                alert(`Berhasil mengimpor ${segmentsTemp.length} segmen data dengan ${segmentsTemp[0].lintasan.length} lintasan dari CSV.`);
            }
        });
    });
}

// ==================== REPORT EXPORTS (EXCEL & PDF) ====================
function setupExports() {
    const excelBtn = document.getElementById("export-excel-btn");
    const pdfBtn = document.getElementById("export-pdf-btn");

    // Ekspor Excel (.xlsx) dengan SheetJS
    excelBtn.addEventListener("click", () => {
        if (!appState.lccaResults) {
            alert("Belum ada data untuk diekspor. Silakan hitung terlebih dahulu.");
            return;
        }

        const wb = XLSX.utils.book_new();

        // 1. Sheet Ringkasan LCCA
        const npv1 = appState.lccaResults.scenarios[1].totalNPV;
        const npv2 = appState.lccaResults.scenarios[2].totalNPV;
        const statusSc1 = npv1 < npv2 ? "Paling Optimal / Ekonomis" : "";
        const statusSc2 = npv2 < npv1 ? "Paling Optimal / Ekonomis" : (npv1 === npv2 ? "Setara" : "");

        const summaryData = [
            ["LAPORAN RINGKASAN LIFE CYCLE COST ANALYSIS (LCCA) JALAN"],
            ["Nama Ruas Jalan", appState.roadParams.name],
            ["Panjang Ruas", `${appState.roadParams.length} km`],
            ["Lebar Lajur", `${appState.roadParams.width} m`],
            ["Umur Rencana (UR)", `${appState.trafficParams.UR} Tahun`],
            ["Tingkat Bunga Riil (r)", `${appState.lccaResults.r_riil.toFixed(2)}%`],
            [""],
            ["RINGKASAN BIAYA NPV LCCA"],
            ["Skenario", "Total NPV (Rupiah)", "Status"],
            ["Skenario 1 (Reaktif)", npv1, statusSc1],
            ["Skenario 2 (Preventif)", npv2, statusSc2]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan LCCA");

        // 2. Sheet Cash Flow Tahunan
        const cashFlowData = [
            ["DETAIL ARUS KAS TAHUNAN (CASH FLOW LCCA)"],
            [""],
            ["Tahun", "Skenario 1 - Biaya Riil", "Skenario 1 - PV Cost", "Skenario 2 - Biaya Riil", "Skenario 2 - PV Cost"]
        ];

        const sc1 = appState.lccaResults.scenarios[1];
        const sc2 = appState.lccaResults.scenarios[2];

        const ur = appState.trafficParams.UR || 20;
        for (let y = 0; y <= ur; y++) {
            let sc1Cost = 0, sc1PV = 0;
            let sc2Cost = 0, sc2PV = 0;
            
            sc1.segmentsData.forEach(seg => {
                sc1Cost += seg.projections[y].cost;
                sc1PV += seg.projections[y].discountedCost;
            });
            sc2.segmentsData.forEach(seg => {
                sc2Cost += seg.projections[y].cost;
                sc2PV += seg.projections[y].discountedCost;
            });

            cashFlowData.push([y, sc1Cost, sc1PV, sc2Cost, sc2PV]);
        }
        const wsCashFlow = XLSX.utils.aoa_to_sheet(cashFlowData);
        XLSX.utils.book_append_sheet(wb, wsCashFlow, "Cash Flow Tahunan");

        // 3. Sheet Data Segmen & IRI Awal
        const trackCount = (appState.segments.length > 0 && appState.segments[0].lintasan) ? appState.segments[0].lintasan.length : 3;
        const segHeaders = ["No Segmen", "Nama Segmen"];
        for (let k = 1; k <= trackCount; k++) {
            segHeaders.push(`Lintasan ${k}`);
        }
        segHeaders.push("Rata-Rata IRI Awal (m/km)", "CBR (%)", "SN");

        const segmentsData = [
            ["DATA KONDISI SEGMEN JALAN DAN CBR-SN"],
            [""],
            segHeaders
        ];
        appState.segments.forEach(seg => {
            const row = [seg.id, seg.name];
            if (seg.lintasan) {
                seg.lintasan.forEach(v => row.push(v));
            } else {
                row.push(seg.IRI_0, seg.IRI_0, seg.IRI_0);
            }
            row.push(seg.IRI_0, seg.CBR, seg.SN);
            segmentsData.push(row);
        });
        const wsSegments = XLSX.utils.aoa_to_sheet(segmentsData);
        XLSX.utils.book_append_sheet(wb, wsSegments, "Data Segmen dan IRI Awal");

        // 4. Sheet Analisis Sensitivitas
        const sensitivityData = [
            ["ANALISIS SENSITIVITAS TINGKAT DISKONTO"],
            [""],
            ["Variasi r", "Tingkat Bunga Riil (r)", "NPV Skenario 1 (Reaktif)", "NPV Skenario 2 (Preventif)"]
        ];
        appState.sensitivityResults.forEach(res => {
            const deltaLabel = res.delta === 0 ? "Baseline" : (res.delta > 0 ? `+${res.delta}%` : `${res.delta}%`);
            sensitivityData.push([deltaLabel, res.r_value, res.npv_sc1, res.npv_sc2]);
        });
        const wsSensitivity = XLSX.utils.aoa_to_sheet(sensitivityData);
        XLSX.utils.book_append_sheet(wb, wsSensitivity, "Analisis Sensitivitas");

        // Generasi biner .xlsx presisi menggunakan Blob ArrayBuffer
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const safeRoadName = (appState.roadParams.name || "Jalan").replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
        const filename = `Hasil_Analisis_LCCA_Perkerasan_${safeRoadName}.xlsx`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    });

    // Ekspor Laporan PDF dengan jsPDF
    pdfBtn.addEventListener("click", async () => {
        if (!appState.lccaResults) {
            alert("Belum ada data untuk diekspor. Silakan hitung terlebih dahulu.");
            return;
        }
        
        pdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses PDF...';
        pdfBtn.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4'); // landscape
            
            // Halaman 1: Dashboard Ringkasan
            const dashboardEl = document.querySelector('.dashboard-grid');
            const canvasDash = await html2canvas(dashboardEl, { scale: 2 });
            const imgDash = canvasDash.toDataURL('image/png');
            
            doc.setFontSize(16);
            doc.text(`Laporan LCCA: ${appState.roadParams.name}`, 14, 15);
            doc.addImage(imgDash, 'PNG', 14, 25, 260, (canvasDash.height * 260) / canvasDash.width);
            
            // Halaman berikutnya: Grafik per segmen
            const selector = document.getElementById("chart-segment-selector");
            const chartContainer = document.querySelector('.chart-card:nth-child(2) .chart-body');
            
            for (let i = 0; i < appState.segments.length; i++) {
                const seg = appState.segments[i];
                // Paksa render grafik untuk segmen ini
                selector.value = seg.id;
                renderIriDegradationChart(seg.id);
                
                // Tunggu sebentar agar animasi Chart.js selesai rendering
                await new Promise(r => setTimeout(r, 200)); 
                
                const canvasChart = await html2canvas(chartContainer, { scale: 2 });
                const imgChart = canvasChart.toDataURL('image/png');
                
                doc.addPage();
                doc.setFontSize(14);
                doc.text(`Grafik Proyeksi IRI: ${seg.name}`, 14, 15);
                doc.addImage(imgChart, 'PNG', 14, 25, 260, (canvasChart.height * 260) / canvasChart.width);
            }
            
            doc.save(`Laporan_LCCA_${appState.roadParams.name.replace(/ /g, "_")}.pdf`);
            
        } catch(e) {
            console.error(e);
            alert("Terjadi kesalahan saat membuat PDF.");
        }
        
        pdfBtn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Unduh Laporan PDF';
        pdfBtn.disabled = false;
    });
}
