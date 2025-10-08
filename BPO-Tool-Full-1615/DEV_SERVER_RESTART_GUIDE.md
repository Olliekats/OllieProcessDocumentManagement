# Development Server Restart Guide

## Issue: Environment Variables Not Loading

When you see "Not Connected - Environment variables not loaded. Server restart required." on the sign-in screen, this means the Vite development server needs to be restarted to pick up the `.env` file.

## Why This Happens

Vite (the build tool) only reads environment variables when the dev server starts. If the `.env` file is created or modified while the server is already running, Vite won't see those changes until it restarts.

## Solution: Restart the Development Server

### Option 1: Automatic Restart (Preferred)
The system should automatically restart the development server when it detects changes to the `.env` file. Wait a few moments after seeing the "Not Connected" message.

**Signs that automatic restart worked:**
- The page reloads automatically
- The connection status changes from red to green
- Browser console shows "✅ Supabase initialized successfully"

### Option 2: Manual Restart (If Automatic Fails)

If the automatic restart doesn't happen within 30 seconds:

1. **Find the terminal running the dev server**
   - Look for a terminal window showing Vite output
   - Should show messages like "VITE v5.4.8 ready in xxx ms"

2. **Stop the server:**
   - Click in the terminal window
   - Press `Ctrl+C` (Windows/Linux) or `Cmd+C` (Mac)
   - Wait for the process to fully stop

3. **Restart the server:**
   ```bash
   npm run dev
   ```

4. **Wait for successful startup:**
   - Look for "Local: http://localhost:5173/"
   - Should see "✅ Supabase initialized successfully" in output

5. **Refresh the browser:**
   - Go back to http://localhost:5173
   - The connection status should now be green

## Verification

### Before Restart (Current State):
```
🔴 Not Connected
Environment variables not loaded. Server restart required.
```

### After Successful Restart:
```
✅ Connected
Connected to 0ec90b57d6e9...supabase.co
```

## Troubleshooting

### If Restart Still Doesn't Work:

1. **Verify .env file exists and is correct:**
   ```bash
   cat .env
   ```

   Should show:
   ```
   VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

2. **Check for file formatting issues:**
   - No extra spaces
   - No leading blank lines
   - No trailing spaces after values
   - Use Unix line endings (LF, not CRLF)

3. **Hard refresh the browser:**
   - Windows/Linux: `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`

4. **Check browser console (F12):**
   - Look for "Supabase initialized successfully" or error messages
   - Check Network tab for failed requests

### If Nothing Works:

**Full Reset:**
```bash
# Stop server (Ctrl+C)

# Clear all caches
rm -rf node_modules/.vite
rm -rf dist

# Restart
npm run dev
```

## Current Status

✅ `.env` file has been fixed (removed leading newline)
✅ Connection status indicator is working
✅ Error messages are clear and helpful
⏳ **Waiting for dev server restart to complete**

## What Happens Next

Once the dev server restarts:

1. **Connection Status Changes:**
   - Red "Not Connected" → Green "Connected"

2. **Authentication Works:**
   - Can create new accounts
   - Can sign in with credentials
   - No "Failed to fetch" errors

3. **Dashboard Loads:**
   - Redirects after successful login
   - All features become available
   - Real-time updates work

## Prevention

To avoid this issue in the future:

1. **Always start dev server AFTER creating .env file**
   - Create `.env` first
   - Then run `npm run dev`

2. **Restart after .env changes**
   - Any time you modify `.env`
   - Stop and restart the dev server
   - Don't rely on hot reload for env variables

3. **Check connection status on load**
   - Look at the status indicator at top of login form
   - Green = good, Red = needs restart

## Quick Reference

| Symptom | Cause | Solution |
|---------|-------|----------|
| Red "Not Connected" status | Env vars not loaded | Restart dev server |
| "Failed to fetch" error | Env vars not loaded | Restart dev server |
| Green "Connected" but still errors | Invalid credentials | Check email/password |
| Console shows "missing" | Env vars not loaded | Restart dev server |
| Console shows "initialized successfully" | Everything working | Try signing in |

---

**Bottom Line:** The `.env` file is now correct. The dev server just needs to restart to pick up the variables. This should happen automatically, but can be done manually if needed.
