// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the signup page
    if (document.getElementById('signupForm')) {
        setupSignupForm();
    }
    
    // Check if we're on the login page
    if (document.getElementById('loginForm')) {
        setupLoginForm();
    }
    
    // Check if user is logged in and update UI accordingly
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname.includes('signup.html')) {
                // Redirect to home if already logged in
                window.location.href = 'home.html';
            }
        } else {
            // User is signed out
            if (window.location.pathname.includes('home.html') ||
                window.location.pathname.includes('profile.html')) {
                // Redirect to login if not authenticated
                window.location.href = 'login.html';
            }
        }
    });
});

// Handle signup form submission
function setupSignupForm() {
    const signupForm = document.getElementById('signupForm');
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const email = signupForm['email'].value;
        const password = signupForm['password'].value;
        const confirmPassword = signupForm['confirmPassword'].value;
        const fullName = signupForm['fullName'].value;
        const phone = signupForm['phone'].value;
        const dob = signupForm['dob'].value;
        const gender = signupForm['gender'].value;
        const address = signupForm['address'].value;
        const city = signupForm['city'].value;
        const state = signupForm['state'].value;
        const pincode = signupForm['pincode'].value;
        const country = signupForm['country'].value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        try {
            // Create user with email and password
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            await db.collection('users').doc(user.uid).set({
                fullName,
                email,
                phone,
                dob,
                gender,
                address,
                city,
                state,
                pincode,
                country,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Send email verification
            await user.sendEmailVerification();
            
            // Redirect to home page
            window.location.href = 'home.html';
            
        } catch (error) {
            showError(error.message);
        }
    });
}

// Handle login form submission
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = loginForm['email'].value;
        const password = loginForm['password'].value;
        
        try {
            // Sign in with email and password
            await auth.signInWithEmailAndPassword(email, password);
            
            // Redirect to home page
            window.location.href = 'home.html';
            
        } catch (error) {
            showError(error.message);
        }
    });
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        showError(error.message);
    });
}

// Show error message
function showError(message) {
    // Check if error container exists, if not create one
    let errorContainer = document.getElementById('error-container');
    
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.style.color = 'white';
        errorContainer.style.backgroundColor = '#e74c3c';
        errorContainer.style.padding = '10px';
        errorContainer.style.borderRadius = '4px';
        errorContainer.style.marginBottom = '15px';
        errorContainer.style.textAlign = 'center';
        
        const form = document.querySelector('form');
        form.insertBefore(errorContainer, form.firstChild);
    }
    
    errorContainer.textContent = message;
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

// Check if user is logged in
function checkAuth() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                reject(new Error('User not authenticated'));
                window.location.href = 'login.html';
            }
        }, reject);
    });
}

// Get current user data from Firestore
async function getCurrentUserData() {
    try {
        const user = auth.currentUser;
        if (!user) return null;
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            return { id: user.uid, email: user.email, ...userDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}
