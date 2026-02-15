# Expense Tracker (Local API)

This project now includes a small Express API server to support secure sign-up/login (POST with password hashing), multi-user expenses stored in a local JSON file, CSV export, and a single-page frontend under `index.html`.

Quick start

1. Install dependencies:

```powershell
npm install
```

2. Start server (dev):

```powershell
npm run dev
```

3. Open the app in your browser:

http://localhost:8000/

Notes

- Sign-up and login use `POST` endpoints at `/api/signup` and `/api/login`.
- Passwords are hashed using `bcrypt` before being saved to `data.json`.
- Email duplication is checked during sign-up.
- Expenses endpoints require a JWT in the `Authorization: Bearer <token>` header.
- Export CSV is available at `/api/export/csv` and via the "Export" button in the Reports page.
- This is a local development setup. For production you should use a real database and secure the JWT secret via environment variables.
