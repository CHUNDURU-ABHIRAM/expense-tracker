// Lightweight auth utilities that use the server API (JWT) instead of Firebase client SDK.

function getToken() {
    return localStorage.getItem('token');
}

async function apiFetch(path, opts = {}) {
    opts.headers = opts.headers || {};
    opts.headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch('/api' + path, opts);
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
