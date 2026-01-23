# 🚨 HOTFIX: Google Auth Production Failure

## Problem
Google Login fails on production (`rollbound.online`) with error: **"Load failed"**

## Root Cause
The production domain is not authorized in Google Cloud Console OAuth settings.

## Fix Steps

### 1. Go to Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (Rollbound)
3. Go to **APIs & Services > Credentials**

### 2. Update OAuth Client ID
1. Click on your OAuth 2.0 Client ID
2. Under **Authorized JavaScript origins**, add:
   - `https://rollbound.online`
   - `https://www.rollbound.online`
3. Under **Authorized redirect URIs**, add:
   - `https://rollbound.online`
   - `https://www.rollbound.online`
4. Click **Save**

### 3. Wait for Propagation
- Changes take **5-10 minutes** to propagate
- No code changes or redeployment needed
- Just wait and test again

## Testing
After waiting 5-10 minutes:
1. Go to https://rollbound.online
2. Click "Sign in with Google"
3. Should now work without "Load failed" error

## Why This Happened
Google OAuth requires all domains to be explicitly whitelisted for security. The localhost domains were configured, but the production domain was not added when deploying.

## Prevention
When deploying to a new domain in the future:
1. Always add the domain to Google Cloud Console FIRST
2. Then deploy the application
3. Test Google login immediately after deployment
