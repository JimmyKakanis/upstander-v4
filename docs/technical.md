# Technical Details

This document covers important technical configurations for the Upstander application.

## Email Notification Service

*   **Provider:** [Resend](https://resend.com/)

Email notifications are sent via Resend, triggered by a Firebase Cloud Function. For the emails to be sent successfully, the function requires a `RESEND_API_KEY` to be set in the Firebase environment variables.

### Setting the API Key

Use the Firebase CLI to set the API key:
```bash
firebase functions:config:set resend.api_key="YOUR_API_KEY" --project <your-project-id>
```

After setting the key, you must redeploy the functions for the change to take effect:
```bash
firebase deploy --only functions --project <your-project-id>
```

## DNS Configuration for Email Deliverability

To ensure that emails sent from `upstander.help` do not end up in spam folders, the following DNS records must be configured in the domain's DNS provider (e.g., Vercel).

### SPF Record

*   **Type:** `TXT`
*   **Name/Host:** `@`
*   **Value:** `v=spf1 include:amazonses.com ~all`

### DKIM Records

*   **Type:** `CNAME`
*   **Name/Host:** `_amazonses.upstander.help`
*   **Value:** `_amazonses.amazonses.com`

---

*   **Type:** `CNAME`
*   **Name/Host:** `_domainkey.upstander.help`
*   **Value:** `_domainkey.amazonses.com`

These records authorize Resend to send emails on behalf of your domain, significantly improving their reliability.

---

## Authentication & Registration

### Registration Flow

The application includes a comprehensive registration flow for new schools:

1. **Public Registration Page** (`/register`): Multi-step form collecting:
   - School Information: Name, Address, City, State, ZIP, Student Count
   - Contact Information: Name, Email, Phone, Password

2. **API Endpoint** (`/api/schools/create`): Server-side endpoint that:
   - Verifies authenticated user via Firebase ID token
   - Creates School document in Firestore `schools` collection
   - Links User document to School via `schoolId` field
   - Updates both `users` and `admins` collections for compatibility

3. **Data Model**:
   - **School Document**: `name`, `nameNormalized` (for duplicate-name prevention), `address`, `city`, `state`, `zip`, `studentCount`, `createdAt`, `createdBy`
   - **User Document**: `email`, `uid`, `displayName`, `phoneNumber`, `schoolId`, `createdAt`

### Additional teachers at the same school

There is **no in-app staff invite** yet. A second full **`/register`** with the **same school display name** is rejected by the API (duplicate school). To attach more staff to an existing school, follow **[Onboarding schools and staff](./onboarding.md)** (Firebase Auth, **`schoolId` custom claim**, and matching **`users`** / **`admins`** documents).

### Firebase Admin SDK Configuration

The registration API route requires Firebase Admin SDK credentials. These must be set in `.env.local` for local development:

```bash
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account-email"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- The `FIREBASE_PRIVATE_KEY` must include the `\n` characters as literal newlines (or use actual newlines).
- For Vercel deployment, these same variables must be set in the Vercel project settings.
- The Firebase Admin SDK is initialized in `lib/firebase-admin.ts` and validates required environment variables on startup.
- **Local onboarding:** Creating a school from `/admin/onboarding` calls `/api/schools/create`, which **only works when Admin env vars are set** in `.env.local`. If you see “Firebase Admin not initialized” or a 503 with a message about missing credentials, add the three `FIREBASE_*` variables from your service account JSON (see root **`.env.example`**).

---

## Local Next.js development and cache issues

Next.js writes compiled output under **`.next/`**. If that folder is only partly updated (crashes, multiple dev servers, switching branches while `next dev` is running, or antivirus locking files), webpack can reference **missing chunk files**. That shows up as server errors like **`Cannot find module './682.js'`** (the number changes), failed **`/_next/static/...`** requests in the browser Network tab, or a page that looks like **unstyled HTML**.

### Default workflow (this repo)

**`npm run dev`** runs `bin/clean-next.cjs` (deletes `.next`) and then **`next dev`**, so every dev session starts from a **consistent cache** and the issues above are much rarer. The first compile after starting can take longer.

Use **`npm run dev:fast`** to skip deleting `.next`** when you trust the cache and want a quicker restart.

### If something still looks broken

1. Stop **all** `next dev` / `next start` for this repo (other terminals; check ports **3000** / **3001**).
2. Run **`npm run dev`** again and use the **exact URL** in the terminal (e.g. if you open **3000** but the server bound to **3001**, assets will 404). Hard-refresh (**Ctrl+Shift+R**).

Delete cache only (no server):

```bash
node bin/clean-next.cjs
```

### Prevention

- Run **one** `next dev` for this project at a time.
- Avoid running **`npm run build`** and **`npm run dev`** in parallel in the same directory if you see flaky behavior.
- If port **3000** is already in use, Next may bind to **3001**; always use the URL shown in the terminal so asset URLs match the running server.

### Production / Vercel

This class of problem is **development-cache** related. Production builds on Vercel run a fresh install and build; if production ever looked broken in the same way, trigger a **redeploy** without build cache (Vercel dashboard) rather than relying on a local `.next` folder.
