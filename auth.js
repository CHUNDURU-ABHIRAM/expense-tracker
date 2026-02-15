// Lightweight auth utilities that use the server API (JWT) instead of Firebase client SDK.

// Get API base URL - for deployed apps, set window.API_BASE_URL before loading this script
// or it defaults to /api for local development
function getApiBaseUrl() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    // For local development (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000/api';
    }
    // For deployed apps, assume backend is served from same origin
    return window.location.origin + '/api';
}

function getToken() {
    return localStorage.getItem('token');
}

async function apiFetch(path, opts = {}) {
    opts.headers = opts.headers || {};
    opts.headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const baseUrl = getApiBaseUrl();
    const res = await fetch(baseUrl + path, opts);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw json;
    return json;
}

async function requireAuth() {
    try {
        const { user } = await apiFetch('/profile');
        return user;
    } catch (err) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        throw err;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

window.getToken = getToken;
window.apiFetch = apiFetch;
window.requireAuth = requireAuth;
window.logout = logout;
