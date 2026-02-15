// Client helpers that use the server-side auth (JWT) and API endpoints.

function setupLogout() {
    const logoutBtns = document.querySelectorAll('.logout-btn, #logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.logout();
        });
    });
}

async function updateUIFromServer() {
    try {
        const res = await window.apiFetch('/profile');
        const user = res.user;
        const userEmailElements = document.querySelectorAll('.user-email, #userEmail');
        const authLinks = document.querySelectorAll('.auth-link');
        const protectedLinks = document.querySelectorAll('.protected-link');

        if (user) {
            userEmailElements.forEach(el => { if (el) el.textContent = user.email || user.name; });
            authLinks.forEach(link => link.style.display = 'none');
            protectedLinks.forEach(link => link.style.display = 'block');
        } else {
            userEmailElements.forEach(el => { if (el) el.textContent = 'Guest'; });
            authLinks.forEach(link => link.style.display = 'block');
            protectedLinks.forEach(link => link.style.display = 'none');
        }
    } catch (err) {
        // Not authenticated — requireAuth or other code will redirect where needed
    }
}

function initApp() {
    setupLogout();
    updateUIFromServer();
    document.getElementById('currentYear') && (document.getElementById('currentYear').textContent = new Date().getFullYear());
}

document.addEventListener('DOMContentLoaded', initApp);

export { initApp };
