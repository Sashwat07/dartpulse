# Vercel deployment and Google sign-in

## 1. Deprecation warning `url.parse()` (DEP0169)

You may see in logs:

```text
DeprecationWarning: `url.parse()` behavior is not standardized... Use the WHATWG URL API instead.
```

- This comes from a **dependency** (NextAuth / openid-client), not from DartPulse code.
- It is a **warning**, not an error. It does **not** block sign-in.
- It will go away when NextAuth or its OAuth stack stops using `url.parse()`.

## 2. Google sign-in on Vercel – checklist

For Google sign-in to work after deployment:

### In Vercel (Environment variables)

Set these for **Production** (and Preview if you want sign-in there):

| Variable           | Value                                                                 |
|--------------------|-----------------------------------------------------------------------|
| `NEXTAUTH_URL`     | Your **full** app URL, e.g. `https://dartpulse-xxx.vercel.app`       |
| `NEXTAUTH_SECRET`  | A long random secret (e.g. `openssl rand -base64 32`)                 |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console                                             |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console                                        |

- **Important:** `NEXTAUTH_URL` must be the exact URL users use (including `https://`). NextAuth uses it to build the callback URL. If it’s wrong or missing, redirects will fail.

### In Google Cloud Console

1. **APIs & Services → Credentials** → your OAuth 2.0 Client ID (Web application).
2. **Authorized redirect URIs** must include **exactly**:
   - `https://<your-vercel-domain>/api/auth/callback/google`
   - Example: `https://dartpulse-q4z6s47i3-datawallahs-projects.vercel.app/api/auth/callback/google`
3. No trailing slash unless your app sends one.
4. If you use multiple Vercel URLs (e.g. previews), add each callback URL you need.

### After changing env or redirect URIs

- Redeploy or wait for Vercel to pick up new env.
- Google changes apply immediately; no redeploy needed.

## 3. If sign-in still fails

- Check **browser** and **Vercel function logs** for the real error (e.g. `redirect_uri_mismatch`, `invalid_client`).
- Confirm `NEXTAUTH_URL` in Vercel matches the URL in the browser.
- Confirm the redirect URI in Google matches exactly what NextAuth uses (see your app URL + `/api/auth/callback/google`).
