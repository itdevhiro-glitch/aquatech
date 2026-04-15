// Check authentication before loading the page
if (!isLoggedIn()) {
    showLoginModal();
}

// Logout handler
window.handleLogout = function() {
    logout();
    window.location.href = 'index.html';
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDxZvpKrQ236bCTOLSzoMrHRR8BINTI-Sw",
    authDomain: "atlantiscorp-af211.firebaseapp.com",
    projectId: "atlantiscorp-af211",
    storageBucket: "atlantiscorp-af211.firebasestorage.app",
    messagingSenderId: "36612462515",
    appId: "1:36612462515:web:7683c3b686d308450addc6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let allDataCache = [];
let currentGradeFilter = 'ALL';

const sections = [
    { id: "phys", name: "Physical Body & Hinge", weight: 10, icon: "fa-laptop" },
    { id: "disp", name: "Display / Screen Panel", weight: 15, icon: "fa-tv" },
    { id: "kybd", name: "Keyboard & Backlight", weight: 10, icon: "fa-keyboard" },
    { id: "tp",   name: "Trackpad & Click Buttons", weight: 5, icon: "fa-mouse-pointer" },
    { id: "port", name: "I/O Ports & Connectivity", weight: 10, icon: "fa-plug" },
    { id: "batt", name: "Battery Health & Cycle", weight: 10, icon: "fa-battery-three-quarters" },
    { id: "cam",  name: "Webcam, Mic & Audio", weight: 10, icon: "fa-video" },
    { id: "perf", name: "Performance & Stress Test", weight: 15, icon: "fa-microchip" },
    { id: "cool", name: "Cooling Fan & Heat Dissipation", weight: 5, icon: "fa-wind" },
    { id: "soft", name: "OS, Drivers & Software Integrity", weight: 10, icon: "fa-compact-disc" }
];

const qcContainer = document.getElementById("dynamicQC");
sections.forEach((s, idx) => {
    let html = `<div class="card"><h3><i class="fas ${s.icon}"></i> ${s.name}</h3><div class="qc-selector">`;
    [{l:"Excellent",v:1},{l:"Good",v:0.7},{l:"Fair",v:0.4},{l:"Fail",v:0}].forEach(o => {
        html += `<div class="qc-btn" data-val="${o.v}" onclick="window.selectQC(this, ${idx})"><input type="radio" name="sec_${idx}" value="${o.v}">${o.l}</div>`;
    });
    html += `</div></div>`;
    qcContainer.innerHTML += html;
});

document.getElementById('tanggal').valueAsDate = new Date();

window.selectQC = (el, idx) => {
    el.parentElement.querySelectorAll('.qc-btn').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    el.querySelector('input').checked = true;
};

window.showPage = (id, navEl) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    navEl.classList.add('active');
    if(id === 'historyPage') loadCloudData();
    if(id === 'statsPage') loadStats();
};

window.processQC = async () => {
    const brand = document.getElementById("brand").value;
    const model = document.getElementById("nama").value;
    const sn = document.getElementById("sn").value;
    if(!model || !sn) return alert("Fill Brand, Model and SN!");
    let score = 0, count = 0;
    sections.forEach((s, i) => {
        const checked = document.querySelector(`input[name="sec_${i}"]:checked`);
        if(checked) { score += parseFloat(checked.value) * s.weight; count++; }
    });
    if(count < sections.length) return alert("Assess all sections!");
    const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : "C";
    const data = {
        brand, model, sn, grade, score: score.toFixed(1),
        cpu: document.getElementById("cpu").value,
        ram: document.getElementById("ram").value,
        ssd: document.getElementById("ssd").value,
        os: document.getElementById("os").value,
        teknisi: document.getElementById("teknisi").value,
        tanggal: document.getElementById("tanggal").value,
        createdAt: serverTimestamp()
    };
    try {
        await addDoc(collection(db, "inspections"), data);
        document.getElementById("finalGrade").innerText = grade;
        document.getElementById("finalGrade").style.color = grade.includes('A') ? 'var(--success)' : 'var(--warning)';
        document.getElementById("finalScore").innerText = `Integrity Score: ${data.score} / 100`;
        document.getElementById("qcInputArea").style.display = "none";
        document.getElementById("resultArea").style.display = "block";
    } catch (e) { alert("Save failed: " + e); }
};

async function loadCloudData() {
    const snapshot = await getDocs(query(collection(db, "inspections"), orderBy("createdAt", "desc")));
    const tbody = document.getElementById("historyTbody");
    tbody.innerHTML = "";
    allDataCache = [];
    snapshot.forEach(doc => {
        const d = doc.data();
        const id = doc.id;
        allDataCache.push({id, ...d});
        const tr = document.createElement("tr");
        tr.setAttribute('data-brand', d.brand);
        tr.setAttribute('data-grade', d.grade);
        tr.onclick = () => openDetail(id);
        tr.innerHTML = `
            <td>${d.tanggal}</td>
            <td><span class="badge" style="background:#f1f5f9; color:#475569">${d.brand}</span></td>
            <td><strong>${d.model}</strong></td>
            <td><code>${d.sn}</code></td>
            <td>${d.teknisi || '-'}</td>
            <td style="font-weight:700">${d.score}</td>
            <td><span class="badge badge-${d.grade[0]}">${d.grade}</span></td>
        `;
        tbody.appendChild(tr);
    });
    window.runComplexFilter();
}

window.openDetail = (id) => {
    const item = allDataCache.find(x => x.id === id);
    if(!item) return;
    document.getElementById("editId").value = id;
    document.getElementById("editBrand").value = item.brand;
    document.getElementById("editNama").value = item.model;
    document.getElementById("editSn").value = item.sn;
    document.getElementById("editCpu").value = item.cpu;
    document.getElementById("editRam").value = item.ram;
    document.getElementById("editSsd").value = item.ssd;
    document.getElementById("editOs").value = item.os || "";
    document.getElementById("editTeknisi").value = item.teknisi;
    document.getElementById("editScore").value = item.score;
    document.getElementById("editGrade").value = item.grade;
    document.getElementById("editTanggal").value = item.tanggal;
    document.getElementById("detailModal").style.display = "flex";
};

window.closeModal = () => document.getElementById("detailModal").style.display = "none";

window.updateCloudData = async () => {
    const id = document.getElementById("editId").value;
    try {
        await updateDoc(doc(db, "inspections", id), {
            brand: document.getElementById("editBrand").value,
            model: document.getElementById("editNama").value,
            cpu: document.getElementById("editCpu").value,
            ram: document.getElementById("editRam").value,
            ssd: document.getElementById("editSsd").value,
            os: document.getElementById("editOs").value,
            teknisi: document.getElementById("editTeknisi").value,
            score: document.getElementById("editScore").value,
            grade: document.getElementById("editGrade").value,
            tanggal: document.getElementById("editTanggal").value
        });
        alert("Cloud Sync Successful!");
        closeModal();
        loadCloudData();
    } catch (e) { alert("Update Error: " + e); }
};

window.filterByGrade = (g, btn) => {
    currentGradeFilter = g;
    document.querySelectorAll('.db-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window.runComplexFilter();
};

window.runComplexFilter = () => {
    const search = document.getElementById("dbSearch").value.toUpperCase();
    const brand = document.getElementById("filterBrand").value.toUpperCase();
    document.querySelectorAll("#historyTbody tr").forEach(row => {
        const textMatch = row.innerText.toUpperCase().includes(search);
        const brandMatch = brand === 'ALL' || row.getAttribute('data-brand').toUpperCase() === brand;
        const gradeMatch = currentGradeFilter === 'ALL' || row.getAttribute('data-grade') === currentGradeFilter;
        row.style.display = (textMatch && brandMatch && gradeMatch) ? "" : "none";
    });
};

const drawSertifikat = (doc, data) => {
    const navy = [15, 23, 42], sky = [14, 165, 233];
    doc.setFillColor(...navy); doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(24);
    doc.text("ATLANTIS", 20, 20); doc.setFont("helvetica", "normal"); doc.text("SYSTEMS", 65, 20);
    doc.setFontSize(10); doc.text("OFFICIAL QUALITY CONTROL REPORT", 20, 30);
    doc.text("SN: " + data.sn, 150, 20);
    doc.setDrawColor(...sky); doc.setLineWidth(1); doc.line(20, 35, 190, 35);
    doc.setTextColor(...navy); doc.setFontSize(14); doc.text("Device Specification", 20, 60);
    doc.autoTable({
        startY: 65, body: [
            ["Brand", data.brand], ["Model", data.model], ["CPU", data.cpu],
            ["RAM", data.ram], ["Storage", data.ssd], ["OS", data.os || "-"], ["Inspection Date", data.tanggal]
        ], theme: 'grid', styles: { fontSize: 10, cellPadding: 5 }, 
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 50 } }
    });
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFillColor(240, 249, 255); doc.roundedRect(20, finalY, 170, 35, 3, 3, 'F');
    doc.setFontSize(11); doc.text("Quality Grade", 30, finalY + 12);
    doc.setFontSize(28); doc.setTextColor(...sky); doc.text(data.grade, 30, finalY + 28);
    doc.setTextColor(...navy); doc.setFontSize(11); doc.text("Integrity Score", 100, finalY + 12);
    doc.setFontSize(22); doc.text(data.score + " / 100", 100, finalY + 28);
    const sigY = finalY + 60;
    doc.setTextColor(...navy); doc.setFontSize(10);
    doc.setFont("helvetica", "bold"); doc.text("Authorized Technician,", 20, sigY);
    doc.setDrawColor(200); doc.setLineWidth(0.5); doc.line(20, sigY + 22, 75, sigY + 22);
    doc.setFont("helvetica", "normal"); doc.text(data.teknisi || "...........................", 20, sigY + 28);
    doc.setFont("helvetica", "bold"); doc.text("Business Owner / Manager,", 130, sigY);
    doc.setDrawColor(200); doc.line(130, sigY + 22, 185, sigY + 22);
    doc.setFont("helvetica", "normal"); doc.text("ATLANTIS OFFICIAL", 130, sigY + 28);
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text("This document is a valid proof of inspection from Atlantis Systems Cloud Database.", 105, 285, null, null, "center");
    doc.text("Data Integrity Secured by Firebase Encryption.", 105, 290, null, null, "center");
    doc.save(`QC_OFFICIAL_${data.brand}_${data.sn}.pdf`);
};

window.generatePerfectPDF = () => {
    drawSertifikat(new window.jspdf.jsPDF(), {
        brand: document.getElementById("brand").value,
        model: document.getElementById("nama").value,
        sn: document.getElementById("sn").value,
        cpu: document.getElementById("cpu").value,
        ram: document.getElementById("ram").value,
        ssd: document.getElementById("ssd").value,
        os: document.getElementById("os").value,
        teknisi: document.getElementById("teknisi").value,
        grade: document.getElementById("finalGrade").innerText,
        score: document.getElementById("finalScore").innerText.split(':')[1].trim().split('/')[0].trim(),
        tanggal: document.getElementById("tanggal").value
    });
};

window.downloadFromModal = () => {
    drawSertifikat(new window.jspdf.jsPDF(), {
        brand: document.getElementById("editBrand").value,
        model: document.getElementById("editNama").value,
        sn: document.getElementById("editSn").value,
        cpu: document.getElementById("editCpu").value,
        ram: document.getElementById("editRam").value,
        ssd: document.getElementById("editSsd").value,
        os: document.getElementById("editOs").value,
        teknisi: document.getElementById("editTeknisi").value,
        grade: document.getElementById("editGrade").value,
        score: document.getElementById("editScore").value,
        tanggal: document.getElementById("editTanggal").value
    });
};

async function loadStats() {
    const snap = await getDocs(collection(db, "inspections"));
    let total = snap.size, sum = 0, aCount = 0;
    snap.forEach(d => {
        const data = d.data();
        sum += parseFloat(data.score);
        if(data.grade.includes('A')) aCount++;
    });
    document.getElementById("statTotal").innerText = total;
    document.getElementById("statAvg").innerText = total ? (sum/total).toFixed(1) : 0;
    document.getElementById("statRate").innerText = total ? Math.round((aCount/total)*100) + "%" : "0%";
}
