// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC3QmZDmHIvOQqWPWqtnqyj3WI_sc8DmNM",
    authDomain: "project-cff58.firebaseapp.com",
    projectId: "project-cff58",
    storageBucket: "project-cff58.appspot.com",
    messagingSenderId: "45758013242",
    appId: "1:45758013242:web:03ca037b76d4ee9aa2ba03"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Check authentication state
function checkAuth() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                window.location.href = 'login.html';
                reject(new Error('User not authenticated'));
            }
        });
    });
}

// Logout function
function setupLogout() {
    const logoutBtns = document.querySelectorAll('.logout-btn, #logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('Error signing out. Please try again.');
            }
        });
    });
}

// Update UI based on auth state
function updateUI(user) {
    const userEmailElements = document.querySelectorAll('.user-email, #userEmail');
    const authLinks = document.querySelectorAll('.auth-link');
    const protectedLinks = document.querySelectorAll('.protected-link');

    if (user) {
        // User is signed in
        userEmailElements.forEach(el => {
            if (el) el.textContent = user.email;
        });
        
        authLinks.forEach(link => link.style.display = 'none');
        protectedLinks.forEach(link => link.style.display = 'block');
    } else {
        // User is signed out
        userEmailElements.forEach(el => {
            if (el) el.textContent = 'Guest';
        });
        
        authLinks.forEach(link => link.style.display = 'block');
        protectedLinks.forEach(link => link.style.display = 'none');
    }
}

// Initialize app
function initApp() {
    // Set up logout functionality
    setupLogout();

    // Check auth state and update UI
    onAuthStateChanged(auth, (user) => {
        updateUI(user);
    });

    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

// Export functions and variables
export { app, auth, db, checkAuth, initApp };

// Initialize the app when the script loads
document.addEventListener('DOMContentLoaded', initApp);
