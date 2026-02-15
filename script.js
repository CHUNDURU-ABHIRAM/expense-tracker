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
  let user = JSON.parse(localStorage.getItem("user"));

  if (user) {
    document.getElementById("pname").value = user.name;
    document.getElementById("pemail").value = user.email;
  }
}

function updateProfile() {
  let name = document.getElementById("pname").value;
  let email = document.getElementById("pemail").value;

  localStorage.setItem("user", JSON.stringify({ name, email }));

  alert("Profile updated successfully!");
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
