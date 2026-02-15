function signup(e) {
  e.preventDefault();

  let name = document.getElementById("name").value;
  let email = document.getElementById("email").value;

  localStorage.setItem("user", JSON.stringify({ name, email }));

  window.location.href = "home.html";
}

function login(e) {
  e.preventDefault();
  window.location.href = "home.html";
}

function goProfile() {
  window.location.href = "profile.html";
}

function goHome() {
  window.location.href = "home.html";
}

function loadProfile() {
  // Prefer server-side profile when available (JWT auth)
  (async () => {
    try {
      const res = await window.apiFetch('/profile');
      const user = res.user || {};
      document.getElementById("pname").value = user.name || '';
      document.getElementById("pemail").value = user.email || '';
    } catch (err) {
      // Fallback to localStorage if server not available
      const user = JSON.parse(localStorage.getItem("user") || '{}');
      document.getElementById("pname").value = user.name || '';
      document.getElementById("pemail").value = user.email || '';
    }
  })();
}

// Called when auth state changes to refresh profile UI if user is on profile page
function refreshProfileUI() {
  // If profile inputs exist, try to populate them from server then fallback to localStorage
  if (document.getElementById('pname') || document.getElementById('pemail')) {
    // Try server-first
    (async () => {
      try {
        await loadProfile();
      } catch (e) {
        // loadProfile already falls back to localStorage
      }
      // Also load budgets if available on the page
      try { if (typeof loadBudgets === 'function') loadBudgets(); } catch(e) { /* ignore */ }
    })();
  }
}

function updateProfile() {
  (async () => {
    const name = document.getElementById("pname").value;
    const email = document.getElementById("pemail").value;
    try {
      await window.apiFetch('/profile', { method: 'PUT', body: JSON.stringify({ name, email }) });
      // update local fallback
      localStorage.setItem("user", JSON.stringify({ name, email }));
      alert('Profile updated successfully');
    } catch (err) {
      console.error('Could not update profile', err);
      alert(err.error || 'Failed to update profile');
    }
  })();
}

function addExpense() {
  let date = document.getElementById("date").value;
  let amount = document.getElementById("amount").value;
  let category = document.getElementById("category").value;
  let desc = document.getElementById("desc").value;

  if (!date || !amount || !category || !desc) {
    alert("Fill all fields");
    return;
  }

  let table = document.getElementById("expenseTable");
  let row = table.insertRow();

  row.innerHTML = `
    <td>${date}</td>
    <td>${amount}</td>
    <td>${category}</td>
    <td>${desc}</td>
    <td><button onclick="this.parentElement.parentElement.remove()">Delete</button></td>
  `;
}

if (window.location.pathname.includes("profile.html")) {
  loadProfile();
}
