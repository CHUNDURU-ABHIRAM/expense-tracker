# Firebase Firestore Security Rules Guide

## How to Set Firestore Rules

To allow users to save their data in Firestore, you need to set up proper security rules:

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your **expensetracker** project
3. Go to **Firestore Database** → **Rules** tab

### Step 2: Replace with These Rules

Copy and paste the following rules into your Firestore Rules editor:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Allow authenticated users to create and manage their expenses
    match /expenses/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Step 3: Publish the Rules

Click the **Publish** button to save and activate the rules.

---

## What These Rules Do

- ✅ Allow **authenticated users** to save their profile in `users/{uid}`
- ✅ Allow **authenticated users** to create and manage their expenses
- ✅ Prevent **unauthorized users** from accessing other users' data
- ✅ Enforce **security** by checking user ID matches

---

## Testing the Setup

After setting the rules:

1. Go to **http://localhost:8000/signup.html**
2. Fill in the signup form with:
   - **Full Name**: Your name
   - **Phone**: Your phone number (optional)
   - **Email**: Your email
   - **Password**: Your password (min 6 chars)
3. Click **Sign Up**
4. Open **Browser DevTools** (F12) → **Console** tab
5. Watch for success messages:
   - `Creating user with email: ...` 
   - `User created successfully: ...`
   - `Saving user data to Firestore...`
   - `User data saved successfully`

---

## If You Get Permission Errors

If you see "**Firestore permission denied**" error:

1. Make sure you **Published** the rules (not just saved the draft)
2. Check the rules are exactly as shown above
3. Most common issue: Rules were not published with the **Publish** button
4. Wait 30 seconds and try again
5. Open **Firestore** → **Data** tab and check if `users` collection was created

---

## Verify Users Are Being Saved

1. In Firebase Console, go to **Firestore Database** → **Data** tab
2. You should see a `users` collection with documents like:
   ```
   users/
     ├── {uid1}/
     │   ├── name: "Your Name"
     │   ├── phone: "Your Phone"
     │   ├── email: "email@example.com"
     │   └── createdAt: timestamp
   ```
3. Users should also appear in **Authentication** → **Users** tab

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No users for this project yet" | Rules not published or signup failed (check console) |
| Permission denied | Publish the Firestore rules |
| User created but not in Firestore | Check browser console for Firestore write errors |
| Auth works but no user doc | Verify `setDoc` succeeded (console logs) |

---

## Next Steps

Once users are saved:
1. Users can log in via **http://localhost:8000/login.html**
2. Dashboard will show their saved name in the top-right
3. Can add expenses, view reports, set budgets, etc.
