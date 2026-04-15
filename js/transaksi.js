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
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let currentUnit = null;

window.showPage = (id, navEl) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(navEl) navEl.classList.add('active');
    if(id === 'inventoryPage') loadInventory();
    if(id === 'appsPage') loadApps();
    if(id === 'historyPage') loadHistory();
};

async function loadInventory() {
    const snap = await getDocs(query(collection(db, "inspections"), orderBy("createdAt", "desc")));
    const tbody = document.getElementById("inventoryTbody");
    tbody.innerHTML = "";
    snap.forEach(d => {
        const item = d.data();
        const id = d.id;
        const statusClass = `status-${(item.status || 'Ready').toLowerCase()}`;
        tbody.innerHTML += `
            <tr>
                <td><strong>${item.brand} ${item.model}</strong><br><small style="color:#64748b">${item.sn}</small></td>
                <td><span class="badge" style="background:#f1f5f9;">${item.grade}</span></td>
                <td><span class="badge ${statusClass}">${item.status || 'Ready'}</span></td>
                <td>Rp ${(item.price || 0).toLocaleString()}</td>
                <td>
                    <button class="btn btn-ghost" style="padding:8px" onclick='openUpdateModal("${id}", ${JSON.stringify(item)})'><i class="fas fa-edit"></i></button>
                    <button class="btn btn-success" style="padding:8px" onclick='openAppPrompt("${id}", ${JSON.stringify(item)})' ${item.status === 'Sold' ? 'disabled' : ''}><i class="fas fa-file-invoice"></i></button>
                </td>
            </tr>
        `;
    });
}

window.openUpdateModal = (id, data) => {
    currentUnit = { id, ...data };
    document.getElementById("unitPrice").value = data.price || 0;
    document.getElementById("unitStatus").value = data.status || "Ready";
    document.getElementById("modalOverlay").style.display = "flex";
};

window.updateUnit = async () => {
    await updateDoc(doc(db, "inspections", currentUnit.id), {
        price: Number(document.getElementById("unitPrice").value),
        status: document.getElementById("unitStatus").value
    });
    closeModal();
    loadInventory();
};

window.saveApp = async () => {
    const name = document.getElementById("appName").value;
    const type = document.getElementById("appType").value;
    if(!name) return alert("Isi nama software!");
    await addDoc(collection(db, "apps"), { name, type });
    document.getElementById("appName").value = "";
    loadApps();
};

async function loadApps() {
    const snap = await getDocs(collection(db, "apps"));
    const container = document.getElementById("appsListContainer");
    container.innerHTML = "";
    
    const grouped = { OS: [], App: [], Game: [], Driver: [] };
    snap.forEach(d => {
        const app = { id: d.id, ...d.data() };
        if (grouped[app.type]) grouped[app.type].push(app);
    });

    const icons = { OS: 'fa-compact-disc', App: 'fa-th-large', Game: 'fa-gamepad', Driver: 'fa-tools' };

    Object.keys(grouped).forEach(cat => {
        if (grouped[cat].length === 0) return;
        const section = document.createElement('div');
        section.className = 'card'; section.style.padding = '0'; section.style.overflow = 'hidden';
        section.innerHTML = `
            <div style="padding:15px 20px; background:#f8fafc; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px;">
                <i class="fas ${icons[cat]}" style="color:var(--accent)"></i>
                <h3 style="margin:0; font-size:16px;">${cat}</h3>
                <span class="badge" style="background:var(--accent); color:white; margin-left:auto;">${grouped[cat].length} Items</span>
            </div>
            <table>
                ${grouped[cat].map(a => `
                    <tr>
                        <td style="width:80%; font-weight:600;">${a.name}</td>
                        <td style="text-align:right;"><button onclick="deleteApp('${a.id}')" style="color:var(--danger); background:none; border:none; cursor:pointer;"><i class="fas fa-trash-alt"></i></button></td>
                    </tr>
                `).join('')}
            </table>
        `;
        container.appendChild(section);
    });
}

window.deleteApp = async (id) => {
    if(confirm("Hapus software ini?")) {
        await deleteDoc(doc(db, "apps", id));
        loadApps();
    }
};

window.openAppPrompt = async (id, data) => {
    currentUnit = { id, ...data };
    const snap = await getDocs(collection(db, "apps"));
    const osContainer = document.getElementById("osOptions");
    const appContainer = document.getElementById("appOptions");
    const gameContainer = document.getElementById("gameOptions");
    osContainer.innerHTML = ""; appContainer.innerHTML = ""; gameContainer.innerHTML = "";

    snap.forEach(d => {
        const app = d.data();
        const html = `<label class="option-item"><input type="${app.type === 'OS' ? 'radio' : 'checkbox'}" name="${app.type === 'OS' ? 'osGroup' : 'appGroup'}" class="app-input-check" value="${app.name}" data-type="${app.type}"> <span>${app.name}</span></label>`;
        if(app.type === 'OS') osContainer.innerHTML += html;
        else if(app.type === 'Game') gameContainer.innerHTML += html;
        else appContainer.innerHTML += html;
    });
    document.getElementById("appPromptOverlay").style.display = "flex";
};

window.processInvoice = async () => {
    const btn = document.getElementById("btnProcessInvoice");
    const custName = document.getElementById("custName").value;
    const custWA = document.getElementById("custWA").value;
    if(!custName || !custWA) return alert("Data Customer wajib diisi!");
    
    btn.disabled = true;
    btn.innerText = "Processing...";

    const selectedOS = document.querySelector('input[data-type="OS"]:checked')?.value || "Standard OS";
    const selectedApps = Array.from(document.querySelectorAll('.app-input-check:checked'))
                                 .filter(cb => cb.getAttribute('data-type') !== 'OS')
                                 .map(cb => cb.value);

    const discPercent = Number(document.getElementById("invDiscount").value);
    const warranty = document.getElementById("invWarranty").value;
    const finalPrice = currentUnit.price - (currentUnit.price * discPercent / 100);

    const docRef = await addDoc(collection(db, "transactions"), {
        unitId: currentUnit.id,
        unitName: `${currentUnit.brand} ${currentUnit.model}`,
        unitSN: currentUnit.sn,
        customerName: custName,
        customerWA: custWA,
        total: finalPrice,
        discount: discPercent,
        os: selectedOS,
        apps: selectedApps,
        warranty: warranty,
        date: serverTimestamp()
    });

    await updateDoc(doc(db, "inspections", currentUnit.id), { status: "Sold" });
    const invNo = docRef.id.toUpperCase().slice(-8);
    generateInvoicePDF(currentUnit, selectedOS, selectedApps, discPercent, warranty, { name: custName, wa: custWA }, invNo);
    
    btn.disabled = false;
    btn.innerHTML = 'Cetak & Simpan <i class="fas fa-check-circle"></i>';
    closeAppPrompt();
    loadInventory();
};

async function loadHistory() {
    const snap = await getDocs(query(collection(db, "transactions"), orderBy("date", "desc")));
    const tbody = document.getElementById("historyTbody");
    tbody.innerHTML = "";
    snap.forEach(d => {
        const trx = d.data();
        const tgl = trx.date ? trx.date.toDate().toLocaleDateString('id-ID') : '-';
        const invId = d.id.toUpperCase().slice(-8);
        tbody.innerHTML += `
            <tr onclick="showTrxDetail('${d.id}')" style="cursor:pointer;">
                <td><span style="font-weight:800; color:var(--accent)">#${invId}</span></td>
                <td>${tgl}</td>
                <td><strong>${trx.customerName}</strong></td>
                <td>Rp ${trx.total.toLocaleString()}</td>
                <td><span class="badge status-ready">PAID</span></td>
            </tr>
        `;
    });
}

window.showTrxDetail = async (id) => {
    const docSnap = await getDoc(doc(db, "transactions", id));
    if(!docSnap.exists()) return;
    const trx = docSnap.data();
    const tgl = trx.date ? trx.date.toDate().toLocaleString('id-ID') : '-';
    
    document.getElementById("detailContent").innerHTML = `
        <div class="detail-item"><span class="detail-label">Invoice ID</span><span class="detail-value">#${id.toUpperCase()}</span></div>
        <div class="detail-item"><span class="detail-label">Waktu</span><span class="detail-value">${tgl}</span></div>
        <div class="section-title">Customer</div>
        <div class="detail-item"><span class="detail-label">Nama</span><span class="detail-value">${trx.customerName}</span></div>
        <div class="detail-item"><span class="detail-label">WhatsApp</span><span class="detail-value">${trx.customerWA}</span></div>
        <div class="section-title">Unit Info</div>
        <div class="detail-item"><span class="detail-label">Unit</span><span class="detail-value">${trx.unitName}</span></div>
        <div class="detail-item"><span class="detail-label">S/N</span><span class="detail-value">${trx.unitSN}</span></div>
        <div class="section-title">Software & Warranty</div>
        <div class="detail-item"><span class="detail-label">OS</span><span class="detail-value">${trx.os}</span></div>
        <div class="detail-item"><span class="detail-label">Apps</span><span class="detail-value">${trx.apps.join(", ") || '-'}</span></div>
        <div class="detail-item"><span class="detail-label">Garansi</span><span class="detail-value">${trx.warranty || '-'}</span></div>
        <div class="section-title">Payment</div>
        <div class="detail-item"><span class="detail-label">Discount</span><span class="detail-value">${trx.discount}%</span></div>
        <div class="detail-item" style="border:none; background:#f0f9ff; padding:10px; border-radius:8px; margin-top:10px;">
            <span class="detail-label" style="color:var(--accent)">TOTAL BAYAR</span>
            <span class="detail-value" style="color:var(--accent); font-size:18px;">Rp ${trx.total.toLocaleString()}</span>
        </div>
    `;
    document.getElementById("detailOverlay").style.display = "flex";
};

function generateInvoicePDF(data, os, apps, discPercent, warranty, customer, invNo) {
    const doc = new window.jspdf.jsPDF();
    const navy = [15, 23, 42], sky = [14, 165, 233];
    const basePrice = data.price || 0;
    const discAmount = (basePrice * discPercent) / 100;
    const finalPrice = basePrice - discAmount;

    doc.setFillColor(...navy); doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold");
    doc.text("ATLANTIS COMPUTER", 20, 25);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text("Premium Quality Laptop & Professional IT Solutions", 20, 32);
    doc.text(`NO. INV : # ${invNo}`, 155, 22);
    doc.text(`DATE    : ${new Date().toLocaleDateString('id-ID')}`, 155, 28);

    doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER:", 20, 60);
    doc.setFont("helvetica", "normal"); doc.text(`${customer.name} (${customer.wa})`, 20, 66);
    doc.setFont("helvetica", "bold"); doc.text("WARRANTY PERIOD:", 140, 60);
    doc.setTextColor(...sky); doc.text(warranty, 140, 66);

    doc.setTextColor(...navy); doc.setFontSize(11); doc.text("A. HARDWARE DETAILS", 20, 80);
    doc.autoTable({
        startY: 83,
        head: [['Device Model', 'Serial Number', 'QC Grade', 'Base Price']],
        body: [[`${data.brand} ${data.model}`, data.sn, data.grade, `Rp ${basePrice.toLocaleString()}`]],
        theme: 'grid', headStyles: { fillColor: navy }
    });

    const secondTableY = doc.lastAutoTable.finalY + 12;
    doc.text("B. INSTALLED SOFTWARE & SERVICES", 20, secondTableY);
    doc.autoTable({
        startY: secondTableY + 3,
        head: [['Category', 'Description', 'Cost']],
        body: [['OS', os, 'Included'], ['Software', apps.length > 0 ? apps.join(", ") : 'Standard Apps', 'Included'], ['Services', 'QC Passed, Internal Cleaning', 'Free']],
        theme: 'grid', headStyles: { fillColor: sky }
    });

    const summaryY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text("Subtotal:", 130, summaryY); doc.text(`Rp ${basePrice.toLocaleString()}`, 190, summaryY, {align: 'right'});
    doc.text(`Discount (${discPercent}%):`, 130, summaryY + 7); doc.setTextColor(200, 0, 0);
    doc.text(`- Rp ${discAmount.toLocaleString()}`, 190, summaryY + 7, {align: 'right'});
    doc.setFillColor(248, 250, 252); doc.rect(125, summaryY + 12, 70, 15, 'F');
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...navy);
    doc.text("TOTAL PAID:", 130, summaryY + 22); doc.setTextColor(...sky);
    doc.text(`Rp ${finalPrice.toLocaleString()}`, 190, summaryY + 22, {align: 'right'});
    doc.save(`INV_${invNo}_${customer.name}.pdf`);
}

window.closeModal = () => document.getElementById("modalOverlay").style.display = "none";
window.closeAppPrompt = () => document.getElementById("appPromptOverlay").style.display = "none";
window.closeDetail = () => document.getElementById("detailOverlay").style.display = "none";

loadInventory();
