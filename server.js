const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

// Load service account for Firebase Admin SDK — ensure this file is kept
// private and not served publicly. Place `serviceAccountKey.json` in the
// project root (not in a public folder) or set credentials via env.
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
  console.log('Firebase Admin initialized');
  app && (app.locals.admin = admin);
} catch (err) {
  console.warn('Firebase Admin not initialized — serviceAccountKey.json missing or invalid');
}

const APP_PORT = process.env.PORT || 8000;
const DATA_FILE = path.join(__dirname, 'data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
// serve uploaded files
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
app.use('/uploads', express.static(UPLOAD_DIR));

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({ storage });

async function loadData() {
  // If Firebase Admin is initialized, use Firestore as primary store
  if (admin && admin.apps && admin.apps.length) {
    const db = admin.firestore();
    const usersSnap = await db.collection('users').get();
    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const expensesSnap = await db.collection('expenses').get();
    const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { users, expenses };
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [], expenses: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

async function saveData(data) {
  if (admin && admin.apps && admin.apps.length) {
    const db = admin.firestore();
    // Replace collections by deleting all existing docs and re-adding
    const usersCol = await db.collection('users').get();
    const batch = db.batch();
    usersCol.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();

    // Write users
    for (const u of data.users || []) {
      await db.collection('users').doc(u.id).set(u);
    }

    // Replace expenses
    const expensesCol = await db.collection('expenses').get();
    const batch2 = db.batch();
    expensesCol.docs.forEach(d => batch2.delete(d.ref));
    await batch2.commit();

    for (const e of data.expenses || []) {
      await db.collection('expenses').doc(e.id).set(e);
    }
    return;
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Sign up (POST required)
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const data = await loadData();
  const exists = (data.users || []).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const user = { id: uuidv4(), name, email, passwordHash: hash, createdAt: new Date().toISOString() };
  data.users.push(user);
  await saveData(data);
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
});

// Login (POST required)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const data = await loadData();
  const user = (data.users || []).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
});

// Get user's expenses
app.get('/api/expenses', authMiddleware, async (req, res) => {
  const data = await loadData();
  const userId = req.user.id;
  const expenses = (data.expenses || []).filter(e => e.userId === userId);
  res.json({ expenses });
});

// Get profile
app.get('/api/profile', authMiddleware, async (req, res) => {
  const data = await loadData();
  const user = (data.users || []).find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const safe = { id: user.id, name: user.name, email: user.email, avatar: user.avatar || null, createdAt: user.createdAt };
  res.json({ user: safe });
});

// Update profile (name, email)
app.put('/api/profile', authMiddleware, async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Missing fields' });
  const data = await loadData();
  const user = (data.users || []).find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  // check email uniqueness
  const other = (data.users || []).find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== user.id);
  if (other) return res.status(409).json({ error: 'Email already in use' });
  user.name = name;
  user.email = email;
  await saveData(data);
  const safe = { id: user.id, name: user.name, email: user.email, avatar: user.avatar || null, createdAt: user.createdAt };
  res.json({ user: safe });
});

// Upload avatar
app.post('/api/profile/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const data = await loadData();
  const user = (data.users || []).find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.avatar = '/uploads/' + req.file.filename;
  await saveData(data);
  const safe = { id: user.id, name: user.name, email: user.email, avatar: user.avatar, createdAt: user.createdAt };
  res.json({ user: safe });
});

// Add expense
app.post('/api/expenses', authMiddleware, async (req, res) => {
  const { date, amount, category, desc } = req.body;
  if (!date || !amount || !category || !desc) return res.status(400).json({ error: 'Missing fields' });
  const data = await loadData();
  const expense = { id: uuidv4(), userId: req.user.id, date, amount: parseFloat(amount), category, desc, createdAt: new Date().toISOString() };
  data.expenses.push(expense);
  await saveData(data);
  res.json({ expense });
});

// Edit expense
app.put('/api/expenses/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { date, amount, category, desc } = req.body;
  const data = await loadData();
  const exp = (data.expenses || []).find(e => e.id === id && e.userId === req.user.id);
  if (!exp) return res.status(404).json({ error: 'Expense not found' });
  if (date) exp.date = date;
  if (amount) exp.amount = parseFloat(amount);
  if (category) exp.category = category;
  if (desc) exp.desc = desc;
  await saveData(data);
  res.json({ expense: exp });
});

// Delete expense
app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const data = await loadData();
  const idx = (data.expenses || []).findIndex(e => e.id === id && e.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Expense not found' });
  data.expenses.splice(idx, 1);
  await saveData(data);
  res.json({ ok: true });
});

// Get user's budgets
app.get('/api/budgets', authMiddleware, async (req, res) => {
  try {
    const data = await loadData();
    const user = (data.users || []).find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Ensure a consistent budgets shape is returned
    user.budgets = user.budgets || { monthlyBudget: 0, categoryBudgets: {} };
    const budgets = {
      monthlyBudget: Number(user.budgets.monthlyBudget) || 0,
      categoryBudgets: user.budgets.categoryBudgets || {}
    };
    res.json({ budgets });
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ error: 'Could not fetch budgets', details: err.message });
  }
});

// Set/update budgets (monthly total and category-wise)
app.put('/api/budgets', authMiddleware, async (req, res) => {
  try {
    const { monthlyBudget, categoryBudgets } = req.body || {};
    console.log('/api/budgets PUT by user:', req.user && req.user.id, 'body:', req.body);
    const data = await loadData();
    const user = (data.users || []).find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.budgets = user.budgets || {};
    if (monthlyBudget !== undefined) {
      user.budgets.monthlyBudget = Number(monthlyBudget) || 0;
    }
    if (categoryBudgets !== undefined) {
      // ensure only numeric values are stored
      const cleaned = {};
      for (const k of Object.keys(categoryBudgets || {})) {
        const v = Number(categoryBudgets[k]);
        if (!Number.isNaN(v)) cleaned[k] = v;
      }
      user.budgets.categoryBudgets = cleaned;
    }
    await saveData(data);
    res.json({ budgets: user.budgets });
  } catch (err) {
    console.error('Error saving budgets:', err);
    res.status(500).json({ error: 'Could not save budgets', details: err.message });
  }
});

// Export CSV
app.get('/api/export/csv', authMiddleware, async (req, res) => {
  const data = await loadData();
  const expenses = (data.expenses || []).filter(e => e.userId === req.user.id);
  const header = 'date,amount,category,description\n';
  const rows = expenses.map(e => `${e.date},"${e.amount}","${e.category}","${(e.desc || '').replace(/"/g, '""')}"`).join('\n');
  const csv = header + rows;
  res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

// Fallback
app.get('/api', (req, res) => res.json({ status: 'ok' }));

app.listen(APP_PORT, () => {
  console.log(`Server running on http://localhost:${APP_PORT}`);
});
