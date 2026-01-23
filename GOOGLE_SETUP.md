# Google Authentication Setup

To enable Google Sign-In, you need to configure a project in the Google Cloud Console.

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "Rollbound").

## 2. Configure OAuth Consent Screen
1. Navigate to **APIs & Services > OAuth consent screen**.
2. Select **External** and click **Create**.
3. Fill in the required fields (App name, User support email, Developer contact information).
4. Click **Save and Continue**.
5. Add scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
6. Add test users if you are in "Testing" mode.

## 3. Create Credentials
1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Select **Web application**.
4. Set **Name** (e.g., "Rollbound Web Client").
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for local development)
   - `http://localhost:3000` (if running built client from server)
   - Your production domain (if applicable)
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173` (for local development)
   - `http://localhost:3000` (if running built client from server)
   - Your production domain (if applicable)
7. Click **Create**.

## 4. Configure Application
1. Copy the **Client ID** (e.g., `12345...apps.googleusercontent.com`).
2. Update `client/.env` (create if missing):
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id-here
   ```
   *Note: If testing locally without .env, you can update `GOOGLE_CLIENT_ID` in `client/src/App.jsx` temporarily.*

3. Update `server/.env` (optional, for verification audience check):
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here
   ```

## 5. Restart
1. Restart your development servers:
   - Client: `npm run dev` in `client/`
   - Server: `npm run start` or `node index.js` in `server/`
