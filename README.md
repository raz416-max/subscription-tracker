# Subscription tracker

## Run it locally
```
npm install
npm run dev
```
Opens at http://localhost:5173

## Publish it (fastest path)

1. Push this folder to a new GitHub repo:
```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/subscription-tracker.git
git push -u origin main
```

2. Go to vercel.com → sign in with GitHub → "New Project" → pick this repo → Deploy.
   Vercel auto-detects Vite. No config needed. You'll get a live URL in under a minute.

## Notes
- Data is stored in the browser (`localStorage`) — each visitor's data stays on their device.
  For shared accounts/logins across devices, add a backend (e.g. Supabase) later.
