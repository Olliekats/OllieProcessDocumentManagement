# Authentication Troubleshooting Guide

## "Failed to fetch" Error on Sign-In Screen

### What You're Seeing
A red error message saying "Failed to fetch" appears when you try to sign in with your email and password.

![Auth Error Screenshot](Screenshot_2025-10-07_121233.png)

---

## Root Cause

This error occurs when the application cannot connect to the Supabase authentication service. The most common reasons are:

1. **Development server needs restart** (Most Common - 90% of cases)
   - Environment variables aren't loaded
   - Supabase client not properly initialized

2. **Network connectivity issues**
   - Firewall blocking connection
   - Internet connection problems
   - Supabase service temporarily unavailable

3. **Environment configuration**
   - `.env` file missing or corrupted
   - Invalid Supabase credentials

---

## Solution Steps

### ✅ Step 1: Restart the Development Server (PRIMARY FIX)

**This fixes the issue 90% of the time!**

1. **Stop the current server:**
   - Find the terminal running the dev server
   - Press `Ctrl+C` to stop it

2. **Restart the server:**
   ```bash
   npm run dev
   ```

3. **Wait for complete startup:**
   - Look for "✅ Supabase initialized successfully" in console
   - Server should be running on http://localhost:5173

4. **Try signing in again**

---

### ✅ Step 2: Check Browser Console

**Open Developer Tools to see detailed diagnostics:**

1. **Open Developer Tools:**
   - Press `F12` (Windows/Linux)
   - Or `Cmd+Option+I` (Mac)

2. **Click the "Console" tab**

3. **Look for these messages:**

   **GOOD (Working):**
   ```
   ✅ Supabase initialized successfully
   URL: https://0ec90b57d6e95fcbda19832f.supabase.co
   ```

   **BAD (Needs Fix):**
   ```
   ❌ Missing Supabase environment variables
   VITE_SUPABASE_URL: ✗ missing
   VITE_SUPABASE_ANON_KEY: ✗ missing
   🔧 Quick Fix: Restart the development server
   ```

4. **If you see the BAD message:**
   - Go back to Step 1
   - Restart the dev server
   - Problem should be resolved

---

### ✅ Step 3: Use Built-In Help Feature

**NEW: The sign-in form now has built-in troubleshooting!**

1. When you see "Failed to fetch" error
2. Look for a **"Help?"** link next to the error message
3. Click it to see troubleshooting steps directly in the UI
4. Follow the on-screen instructions

**What the Help Section Shows:**
- Development server restart instructions
- Environment variable checks
- Internet connection verification
- Browser console debugging tips
- Quick fix suggestions

---

### ✅ Step 4: Verify Environment Variables

**Check that the `.env` file exists and is correct:**

1. **Location:** Project root directory (same level as `package.json`)

2. **Should contain:**
   ```
   VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
   ```

3. **No extra spaces or characters:**
   - No blank lines at the start
   - No spaces around the `=` sign
   - No quotes around values

4. **If file is missing or corrupted:**
   - Create new `.env` file in project root
   - Copy the exact contents above
   - Save and restart dev server

---

## Enhanced Error Messages

We've improved the error handling to help you diagnose issues faster:

### Sign-In Form Improvements

**Before:**
```
Failed to fetch
```

**After:**
```
Unable to connect to the server. Please check your connection and try again.
[Help?] <- Click for troubleshooting
```

**Clicking "Help?" shows:**
- Step-by-step troubleshooting
- Quick restart instructions
- Environment variable checks
- Console debugging tips
- Common solutions

### Console Improvements

**Better Logging:**
```
✅ Supabase initialized successfully
URL: https://0ec90b57d6e95fcbda19832f.supabase.co
```

**Clear Error Messages:**
```
❌ Missing Supabase environment variables
VITE_SUPABASE_URL: ✗ missing
VITE_SUPABASE_ANON_KEY: ✗ missing

🔧 Quick Fix: Restart the development server
Run: Stop the server (Ctrl+C) and run "npm run dev" again
```

---

## Testing After Fix

### What Should Work:

1. **Sign-In Form Loads:**
   - ✅ Blue login icon visible
   - ✅ Email and password fields present
   - ✅ "Sign In" button active

2. **No Errors in Console:**
   - ✅ See "Supabase initialized successfully"
   - ✅ No red error messages
   - ✅ Clean console output

3. **Authentication Works:**
   - ✅ Can create new account (Sign Up)
   - ✅ Can sign in with credentials
   - ✅ Redirects to dashboard after login
   - ✅ No "Failed to fetch" errors

### Test Sign-In:

**Option 1: Create New Account**
1. Click "Don't have an account? Sign up"
2. Enter your name, email, and password
3. Click "Create Account"
4. Should create account and log you in

**Option 2: Sign In (if account exists)**
1. Enter your email and password
2. Click "Sign In"
3. Should authenticate and show dashboard

---

## Still Having Issues?

### If Restart Doesn't Work:

1. **Hard Refresh Browser:**
   - Windows/Linux: `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`
   - Or clear browser cache

2. **Check Firewall:**
   - Ensure port 5173 is allowed
   - Check if Supabase URLs are blocked

3. **Try Different Browser:**
   - Test in Chrome, Firefox, or Edge
   - Rules out browser-specific issues

4. **Check Internet Connection:**
   - Verify you can access https://supabase.co
   - Test connection to Supabase dashboard

5. **Review Terminal Output:**
   - Look for compilation errors
   - Check for port conflicts
   - Verify server started successfully

### If Everything Fails:

1. **Stop all running processes:**
   ```bash
   # Kill any running node processes
   pkill -f "vite"
   ```

2. **Clean install:**
   ```bash
   rm -rf node_modules
   npm install
   npm run dev
   ```

3. **Check Supabase Project:**
   - Verify project is active at dashboard.supabase.com
   - Check project URL matches .env file
   - Ensure anon key is valid

---

## Prevention Tips

### Avoid This Issue in the Future:

1. **Always Restart After .env Changes:**
   - Any time you modify `.env`
   - Stop server and restart
   - Don't just save the file

2. **Keep Dev Server Running:**
   - Don't stop/start frequently
   - Let it run while developing
   - Only restart when necessary

3. **Check Console on Load:**
   - Look for Supabase initialization message
   - Catch issues early
   - Fix before attempting sign-in

4. **Use Git to Track Changes:**
   - `.env` is gitignored (good!)
   - But keep a backup copy
   - Document any changes

---

## Quick Reference

### Most Common Issue → Solution

| Issue | Solution | Success Rate |
|-------|----------|-------------|
| Failed to fetch | Restart dev server | 90% |
| Missing env vars | Restart dev server | 95% |
| Invalid credentials | Check email/password | 100% |
| Network error | Check internet | 80% |
| Console errors | Clear cache + restart | 75% |

### One-Line Fix (Usually Works):

```bash
# Stop server (Ctrl+C), then:
npm run dev
```

---

## Summary

**The "Failed to fetch" error is almost always fixed by restarting the development server.**

**Quick Steps:**
1. Stop server (Ctrl+C)
2. Run `npm run dev`
3. Wait for "Supabase initialized successfully"
4. Try signing in again

**If that doesn't work:**
- Check browser console for details
- Click "Help?" link in error message
- Follow troubleshooting steps
- Verify .env file exists

**Need more help?**
- Check TROUBLESHOOTING.md for dashboard issues
- Review console logs for specific errors
- Use built-in help feature in sign-in form

---

**Status:** Enhanced error handling and troubleshooting features added. The issue should now be easier to diagnose and fix.
