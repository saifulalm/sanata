# Debug Guide: Tool Inventory Redirect Issue

## Problem
User is redirected to login when trying to access Tool Inventory page.

## Debugging Added

### Frontend Files Modified

#### 1. `src/lib/adminAuth.ts`
- Enhanced `extractCookieValue()` to handle multiple cookies
- Added logging for `set-cookie` headers
- Added logging for extracted refresh token

#### 2. `src/app/admin/login/actions.ts`
- Added logging for cookie names being set
- Added warning if no refresh token is available

#### 3. `src/proxy.ts` (Middleware)
- Added logging for cookies presence and validity
- Added logging for refresh attempts and results

#### 4. `src/lib/adminApi.ts`
- Added logging for token existence and validity

### Backend Files Modified

#### 1. `src/controllers/auth.controller.ts`
- Added logging for refresh token and set-cookie header

## How to Debug

### Step 1: Check Backend Logs
When user logs in, look for these logs in the backend console:
```
[Auth] Login endpoint hit
[Auth] Generated token: eyJhbG...
[Auth] Token payload: {...}
[Auth] Refresh token: abc123...
[Auth] set-cookie header: sanata_refresh=abc123...; HttpOnly; Secure; Path=/; Max-Age=604800
```

### Step 2: Check Frontend Login Action Logs
In the Next.js server console:
```
[loginWithExpress] Set-Cookie headers: ["sanata_refresh=abc123...; HttpOnly; ..."]
[loginWithExpress] Extracted refresh token: abc123...
[Login Action] Access token: eyJhbG...
[Login Action] Refresh token: abc123...
[Login Action] ACCESS_COOKIE set: admin_access
[Login Action] REFRESH_COOKIE set: sanata_refresh
```

### Step 3: Check Middleware Logs
On every request to `/admin/*`:
```
[Middleware] Path: /admin/workforce/tools
[Middleware] ACCESS_COOKIE exists: true
[Middleware] ACCESS_COOKIE length: 185
[Middleware] REFRESH_COOKIE exists: true
[Middleware] Token is valid, proceeding
```

Or if there's an issue:
```
[Middleware] Path: /admin/workforce/tools
[Middleware] ACCESS_COOKIE exists: false
[Middleware] Token is invalid or missing, trying refresh...
[Middleware] No refresh token available
[Middleware] Auth failed for path: /admin/workforce/tools
```

### Step 4: Check Server Component Logs
```
[getAdminSession] Token exists: true
[getAdminSession] Token valid: true
```

## Common Issues

### Issue 1: Refresh Token is NULL
**Symptom**: `[Login Action] WARNING: No refresh token to set!`
**Cause**: Backend set-cookie header not being parsed correctly
**Fix**: Check backend logs for `[Auth] set-cookie header`

### Issue 2: ACCESS_COOKIE not set
**Symptom**: `[Middleware] ACCESS_COOKIE exists: false`
**Cause**: Login action cookies not being committed
**Fix**: Check if cookies are set before redirect

### Issue 3: Token Invalid
**Symptom**: `[Middleware] Token is invalid or missing`
**Cause**: Token expired or malformed
**Fix**: Check token validity with JWT decoder

### Issue 4: Refresh Fails
**Symptom**: `[Middleware] Token refresh returned ok=false`
**Cause**: Refresh token expired or invalid
**Fix**: Check backend refresh endpoint logs

## Test Procedure

1. Clear all cookies in browser
2. Open browser DevTools (F12) -> Network tab
3. Login and observe:
   - Response headers for login request
   - set-cookie header presence
4. Navigate to Tool Inventory
5. Check server console logs for the flow

## Files to Watch

- `frontend-next/src/app/admin/login/actions.ts`
- `frontend-next/src/proxy.ts`
- `frontend-next/src/lib/adminApi.ts`
- `frontend-next/src/lib/adminAuth.ts`
- `backend/src/controllers/auth.controller.ts`
