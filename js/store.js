import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let allProducts = [];
let currentBrandFilter = 'ALL';

async function init() {
    try {
        // Fetch data, ordering by date
        const snap = await getDocs(query(collection(db, "inspections"), orderBy("createdAt", "desc")));
        allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Bug fix: Ensure status is treated as 'Ready' if missing/undefined
        allProducts.forEach(p => { if (!p.status) p.status = 'Ready'; });

        updateHeaderCount();
        applyFilters(); // Initial render
    } catch (err) {
        console.error("Database Error:", err);
        document.getElementById('catalogGrid').innerHTML = `
            <div class="col-span-full text-center py-20 text-red-500 bg-white rounded-3xl border border-red-100">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p class="font-bold">Gagal terhubung ke Cloud Database.</p>
                <p class="text-sm mt-1">Silakan refresh halaman atau coba lagi nanti.</p>
            </div>`;
    }
}

function updateHeaderCount() {
    // FIX BUG: Only count units with status 'Ready'
    const readyCount = allProducts.filter(p => p.status === 'Ready').length;
    document.getElementById('count-ready').innerText = `${readyCount} Unit`;
}

window.setBrandFilter = (brand) => {
    currentBrandFilter = brand;
    
    // UI UX: Update active pill state
    document.querySelectorAll('#brandPillContainer .brand-pill').forEach(pill => {
        pill.classList.remove('active');
        if(pill.innerText === brand || (brand === 'ALL' && pill.innerText === 'Semua')) {
            pill.classList.add('active');
        }
    });
    applyFilters();
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusTerm = document.getElementById('statusFilter').value;

    const filtered = allProducts.filter(p => {
        // Bug fix handled in init(), status is never null here
        const matchesSearch = !searchTerm || p.model.toLowerCase().includes(searchTerm) || p.brand.toLowerCase().includes(searchTerm) || p.cpu.toLowerCase().includes(searchTerm);
        const matchesBrand = currentBrandFilter === 'ALL' || p.brand === currentBrandFilter;
        const matchesStatus = statusTerm === 'ALL' || p.status === statusTerm;
        
        return matchesSearch && matchesBrand && matchesStatus;
    });

    renderGrid(filtered);
}

function renderGrid(items) {
    const grid = document.getElementById('catalogGrid');
    if (items.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-24 text-slate-500 bg-white rounded-3xl border border-slate-100 animate-fadeIn">
                <i class="fas fa-search-minus text-5xl mb-6 text-slate-300"></i>
                <p class="font-bold text-lg">Unit Tidak Ditemukan</p>
                <p class="text-sm mt-1">Coba ubah filter pencarian atau pilih brand lain.</p>
            </div>`;
        return;
    }

    grid.innerHTML = items.map((p, index) => {
        const isSold = p.status === 'Sold';
        // Delay animation based on index
        const delay = index * 50; 
        
        return `
        <div class="product-card group relative bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-xl shadow-slate-50 cursor-pointer overflow-hidden animate-fadeIn" 
             style="animation-delay: ${delay}ms" onclick="openModal('${p.id}')">
            
            ${isSold ? `
                <div class="absolute top-6 right-6 z-20 bg-slate-100 text-slate-500 px-4 py-1 rounded-full font-bold text-xs flex items-center gap-2">
                    <i class="fas fa-archive"></i> Unit Sold
                </div>
            ` : `
                <div class="absolute top-6 right-6 z-20 bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full font-bold text-xs flex items-center gap-1.5">
                    <i class="fas fa-circle text-[8px]"></i> Ready Stock
                </div>
            `}
            
            <div class="flex justify-between items-center mb-6">
                <span class="text-xs font-black bg-slate-100 px-4 py-1.5 rounded-full text-slate-600 uppercase tracking-widest">${p.brand}</span>
            </div>

            <div class="h-44 rounded-3xl flex items-center justify-center transition mb-6 ${isSold ? 'bg-slate-50' : 'bg-sky-50 group-hover:bg-sky-100' }">
                <i class="fas fa-laptop text-7xl ${isSold ? 'text-slate-200' : 'text-sky-200 group-hover:text-sky-300'}"></i>
            </div>

            <h3 class="text-xl font-extrabold text-slate-900 leading-tight ${isSold ? 'opacity-60' : ''}">${p.model}</h3>
            <p class="text-xs text-slate-400 font-medium mt-1.5 line-clamp-1">${p.cpu} / ${p.ram} / ${p.ssd}</p>
            
            <div class="mt-8 pt-7 border-t border-slate-100 flex justify-between items-center">
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase leading-none">Harga Net</p>
                    <p class="text-xl font-black ${isSold ? 'text-slate-400' : 'text-slate-950'} mt-1">
                        Rp ${(parseInt(p.price) || 0).toLocaleString('id-ID')}
                    </p>
                </div>
                <div class="w-12 h-12 rounded-2xl ${isSold ? 'bg-slate-200 text-slate-400' : 'bg-sky-600 text-white shadow-lg shadow-sky-100'} flex items-center justify-center transition group-hover:scale-105">
                    <i class="fas fa-arrow-right"></i>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if(!p) return;

    const isSold = p.status === 'Sold';
    const modal = document.getElementById('productModal');
    const container = document.getElementById('modalContainer');
    
    // Fill Data
    document.getElementById('modalBrand').innerText = p.brand;
    document.getElementById('modalTitle').innerText = p.model;
    document.getElementById('modalCpu').innerText = p.cpu;
    document.getElementById('modalRam').innerText = p.ram;
    document.getElementById('modalSsd').innerText = p.ssd;
    document.getElementById('modalGrade').innerText = `Grade ${p.grade}`;
    document.getElementById('modalPrice').innerText = `Rp ${(parseInt(p.price) || 0).toLocaleString('id-ID')}`;
    
    // UI Update berdasarkan status
    const header = document.getElementById('modalHeaderBg');
    const actionBtn = document.getElementById('modalActionBtn');

    if (isSold) {
        header.className = "h-44 bg-slate-500 p-10 flex items-end relative overflow-hidden";
        document.getElementById('modalGrade').parentElement.className = "bg-slate-50 p-4 rounded-xl border border-slate-100"; // Emerald box to gray
        document.getElementById('modalGrade').className = "text-xs font-bold text-slate-500 mt-1";
        
        actionBtn.className = "bg-slate-100 text-slate-400 px-10 py-5 rounded-2xl font-bold text-lg w-full md:w-auto cursor-not-allowed flex items-center gap-2";
        actionBtn.innerHTML = `<i class="fas fa-times-circle"></i> Unit Sudah Laku`;
        actionBtn.setAttribute('onclick', `window.open('https://wa.me/6282191847167?text=Halo Atlantis, saya tertarik dengan ${p.brand} ${p.model} yang ada di katalog. Apakah unit ini masih ready?')`);
    } else {
        header.className = "h-44 bg-gradient-to-r from-sky-600 to-indigo-600 p-10 flex items-end relative overflow-hidden";
        document.getElementById('modalGrade').parentElement.className = "bg-emerald-50 p-4 rounded-xl border border-emerald-100"; // Gray back to emerald
        document.getElementById('modalGrade').className = "text-xs font-bold text-emerald-700 mt-1";

        actionBtn.className = "bg-sky-600 text-white hover:bg-sky-700 px-10 py-5 rounded-2xl font-bold text-lg shadow-sky-100 w-full md:w-auto flex items-center gap-2";
        actionBtn.innerHTML = `<i class="fab fa-whatsapp"></i> Tanya Admin via WA`;
        actionBtn.setAttribute('onclick', `window.open('https://wa.me/62xxxxxxxxxx?text=Halo Atlantis, saya tertarik dengan ${p.brand} ${p.model} harga Rp ${parseInt(p.price).toLocaleString('id-ID')}')`);
    }

    // Show Modal with animation
    modal.classList.replace('hidden', 'flex');
    setTimeout(() => {
        container.classList.remove('scale-95', 'opacity-0');
        container.classList.add('scale-100', 'opacity-100');
    }, 10);
}

window.closeModal = () => {
    const modal = document.getElementById('productModal');
    const container = document.getElementById('modalContainer');
    
    container.classList.add('scale-95', 'opacity-0');
    container.classList.remove('scale-100', 'opacity-100');
    
    setTimeout(() => {
        modal.classList.replace('flex', 'hidden');
    }, 300); // Wait for transition
}

// UX: Close on outside click
window.handleOutsideClick = (event) => {
    if(event.target.id === 'productModal') closeModal();
}

// Listeners
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);

init();
