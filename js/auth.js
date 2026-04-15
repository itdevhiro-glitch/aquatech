// Firebase Authentication System
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDxZvpKrQ236bCTOLSzoMrHRR8BINTI-Sw",
    authDomain: "atlantiscorp-af211.firebaseapp.com",
    projectId: "atlantiscorp-af211",
    storageBucket: "atlantiscorp-af211.firebasestorage.app",
    messagingSenderId: "36612462515",
    appId: "1:36612462515:web:7683c3b686d308450addc6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let currentUser = null;

// Monitor authentication state changes
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        closeLoginModal();
    }
});

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Login function using Firebase Authentication
async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return true;
    } catch (error) {
        console.error('Login error:', error.code);
        throw error;
    }
}

// Logout function
async function logout() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Get current user info
function getCurrentUser() {
    return currentUser;
}

// Get user email
function getUserEmail() {
    return currentUser?.email || null;
}

// Show login modal
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Close login modal
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginUsername')?.value || '';
    const password = document.getElementById('loginPassword')?.value || '';
    const errorMsg = document.getElementById('loginError');
    const loginBtn = event.target.querySelector('button[type="submit"]');

    if (!email || !password) {
        if (errorMsg) {
            errorMsg.textContent = 'Email dan password harus diisi!';
        }
        return;
    }

    try {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Loading...';
        
        await login(email, password);
        closeLoginModal();
        window.location.href = window.location.pathname;
    } catch (error) {
        if (errorMsg) {
            switch(error.code) {
                case 'auth/invalid-email':
                    errorMsg.textContent = 'Format email tidak valid!';
                    break;
                case 'auth/user-not-found':
                    errorMsg.textContent = 'Email tidak terdaftar!';
                    break;
                case 'auth/wrong-password':
                    errorMsg.textContent = 'Password salah!';
                    break;
                case 'auth/too-many-requests':
                    errorMsg.textContent = 'Terlalu banyak percobaan login. Coba lagi nanti.';
                    break;
                default:
                    errorMsg.textContent = 'Gagal login. Silakan coba lagi.';
            }
        }
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if login is required
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'required' || params.get('login') === 'expired') {
        showLoginModal();
    }
});
