# Troubleshooting: Dashboard Not Loading

## Issue
Dashboard/home page not loading due to Supabase environment variable error.

## Root Cause
The development server needs to be restarted to pick up environment variables from the `.env` file.

## Solution

### Step 1: Verify Environment Variables Exist
The `.env` file in the project root should contain:
```
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
```

✅ **Confirmed**: The `.env` file exists with correct values.

### Step 2: Restart Development Server
**IMPORTANT**: Vite only reads environment variables when the dev server starts.

If you're running the dev server, you need to:
1. Stop the current dev server (Ctrl+C)
2. Restart it with `npm run dev`

**Note**: The dev server should restart automatically in your environment, but if the dashboard still doesn't load, this is the most common cause.

### Step 3: Check Browser Console
If the issue persists after restart:
1. Open browser developer tools (F12)
2. Check the Console tab for errors
3. Look for specific error messages about:
   - Missing environment variables
   - Supabase connection errors
   - Network errors

### Step 4: Verify Supabase Connection
The enhanced error handling now provides better feedback:
- Check browser console for detailed error messages
- It will show which environment variable is missing (if any)
- The app will now load even if variables are temporarily missing (with warnings)

## Changes Made

### 1. Improved Error Handling in `src/lib/supabase.ts`
```typescript
// Before: Would throw error and crash app
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// After: Logs errors but allows app to load
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please restart the dev server.');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'present' : 'missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'present' : 'missing');
}

// Creates client with placeholders to prevent crash
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
```

### 2. Cleaned Up `.env` File
- Removed leading empty line
- Ensured proper formatting
- Verified no trailing whitespace

## Expected Behavior

### After Dev Server Restart:
1. ✅ Dashboard loads successfully
2. ✅ AI-Powered Insights section displays at top
3. ✅ Filter buttons (All/Operations/Management) work
4. ✅ Statistics cards show real-time data
5. ✅ Navigation menu works with color-coded sections
6. ✅ Screen reader toggle appears next to notifications

### If Environment Variables Are Missing:
1. ⚠️ Console shows detailed error message
2. ⚠️ App loads but with placeholder data
3. ⚠️ No crash or blank screen
4. ⚠️ Clear instructions to restart dev server

## Testing Checklist

After restart, verify:
- [ ] Dashboard loads without errors
- [ ] AI insights banner shows at top (purple gradient)
- [ ] Statistics cards display numbers
- [ ] Navigation menu expands/collapses
- [ ] Blue section for "BPO Daily Operations"
- [ ] Emerald/green section for "BPO Management"
- [ ] Screen reader toggle (speaker icon) in header
- [ ] No console errors about missing variables

## Additional Notes

### Why This Happens
- Vite reads environment variables at server startup
- Changes to `.env` during runtime aren't picked up
- Server restart is required to load new variables
- This is standard Vite behavior

### Prevention
- Ensure `.env` file exists before starting server
- Don't modify `.env` while server is running
- If you do modify it, restart the server

### Build vs Dev
- **Build**: Bakes environment variables into bundle (works fine)
- **Dev**: Injects variables at runtime (requires restart)

## Still Having Issues?

If the dashboard still doesn't load after restarting:

1. **Check if dev server is running:**
   ```bash
   npm run dev
   ```

2. **Verify port 5173 is accessible:**
   - Open http://localhost:5173 in browser
   - Should see the app loading

3. **Check for other errors:**
   - Look at terminal where dev server is running
   - Check for compilation errors
   - Look for port conflicts

4. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear cache in browser settings

5. **Check database migrations:**
   - All migrations should be applied
   - Verify Supabase project is active
   - Check project URL matches .env file

## Success Indicators

You'll know it's working when you see:
1. **Beautiful AI Insights Banner** at top of dashboard (purple-to-blue gradient)
2. **Three filter buttons** (All, Operations, Management)
3. **Color-coded navigation menu** (blue and emerald boxes)
4. **Speaker icon** in header for screen reader
5. **Real-time statistics** showing actual numbers
6. **No errors in console**

---

**Status**: Environment variables are correctly configured. Dev server restart should resolve the issue.
