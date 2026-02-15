import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDC8SAf69moLKC12zGFaPm4-8t6SQY1KWs",
  authDomain: "expensetracker-7eb1b.firebaseapp.com",
  projectId: "expensetracker-7eb1b",
  storageBucket: "expensetracker-7eb1b.firebasestorage.app",
  messagingSenderId: "995616474379",
  appId: "1:995616474379:web:5119959de21668d1054e0e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
