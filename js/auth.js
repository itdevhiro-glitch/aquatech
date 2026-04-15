// Simple Authentication System using localStorage
const AUTH_KEY = 'ATLANTIS_ADMIN_AUTH';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'atlantis123'; // In production, use proper backend auth

// Check if user is logged in
function isLoggedIn() {
    const authData = localStorage.getItem(AUTH_KEY);
    if (!authData) return false;
    try {
        const data = JSON.parse(authData);
        return data.isAuthenticated === true && data.timestamp > (Date.now() - 24*60*60*1000); // 24 hour session
    } catch (e) {
        return false;
    }
}

// Login function
function login(username, password) {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const authData = {
            isAuthenticated: true,
            username: username,
            timestamp: Date.now()
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        return true;
    }
    return false;
}

// Logout function
function logout() {
    localStorage.removeItem(AUTH_KEY);
}

// Get current admin info
function getAdminInfo() {
    if (!isLoggedIn()) return null;
    try {
        return JSON.parse(localStorage.getItem(AUTH_KEY));
    } catch (e) {
        return null;
    }
}

// Check auth and redirect if not logged in
function checkAuthAndRedirect() {
    if (!isLoggedIn()) {
        window.location.href = window.location.pathname + '?login=required';
        return false;
    }
    return true;
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
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername')?.value || '';
    const password = document.getElementById('loginPassword')?.value || '';
    const errorMsg = document.getElementById('loginError');

    if (login(username, password)) {
        closeLoginModal();
        window.location.href = window.location.pathname;
    } else {
        if (errorMsg) {
            errorMsg.textContent = 'Username atau password salah!';
        }
        console.log('Login failed');
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
