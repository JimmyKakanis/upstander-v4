# Onboarding schools and staff

This guide describes how schools and administrators get onto Upstander, and how to add **additional teachers**—first through the **in-app invite** flow, then through **manual** steps if you cannot use email.

## How the first administrator gets set up (self-serve)

Most schools start without manual Firebase data entry:

1. **Full registration** — Staff use **`/register`**. The app creates a Firebase Auth user, calls **`/api/schools/create`** to create a document in the **`schools`** collection, and writes **`schoolId`** and **`role: admin`** on the user’s **`users/{uid}`** and **`admins/{uid}`** documents.
2. **Minimal path** — Staff use **`/login`** then **`/admin/onboarding`** (school name only). The same **`/api/schools/create`** endpoint creates the school and links the account.

Important details:

- **`schoolId` is the Firestore document ID** of the school (auto-generated). It is **not** a hand-chosen slug. The student reporting URL is **`/report/{schoolId}`** using that id.
- **Duplicate school names are blocked** at the API layer (normalized name + transaction). A second full **`/register`** for the *same* school display name will not create another school document.

After checkout / subscription steps, staff use **`/admin/dashboard`** as usual.

## Adding more teachers (in-app, recommended)

1. A **school admin** opens **Settings** → **Add a teacher**, enters the colleague’s work email, and sends the invite. **`/api/schools/invite`** (Resend) stores **`schoolInvites/{token}`** and emails a link: **`/join?token=…&e=…`**.
2. The colleague opens the link (or you **copy the full link** from **Settings** → pending invitations if email failed) and signs in or creates an account **with that same email**. **`/api/schools/join`** links them to the school with **`role: teacher`**.

The billing owner and subscription are unchanged; new teachers use the **school’s** subscription (see `lib/server/subscription.ts`).

## Adding more teachers (manual / legacy, no invite email)

Use this when you cannot use the email flow (e.g. deliverability) and must wire accounts in the console or scripts.

### 1. Get the school id

In **Firebase Console → Firestore → `schools`**, find the school document. Its **document id** is the canonical **`schoolId`** every staff member for that school must share.

### 2. Create each additional teacher in Firebase Authentication

**Authentication → Users → Add user** (email + password or passwordless flow, per your policy). Copy the new user’s **UID**.

### 3. Set the `schoolId` custom claim

Several rules compare **`request.auth.token.schoolId`** to the report’s **`schoolId`**. Set:

```js
await admin.auth().setCustomUserClaims(uid, { schoolId: "<same-school-document-id>" });
```

The user must **sign out and sign in again** (or refresh their ID token) so the new claim appears on the token.

> **Note:** Older internal docs referenced `scripts/set-admin-claim.js`. That script is not part of this repository; use Admin SDK in your environment instead.

### 4. Create Firestore profile documents

For each new UID, create or update:

| Collection | Document id | Fields (minimum) |
|------------|-------------|------------------|
| **`users`** | `{uid}` | `email`, **`schoolId`**, **`role`**: `"admin"` or `"teacher"` (and any other fields you use) |
| **`admins`** | `{uid}` | Same **`schoolId`** and identity fields for compatibility with legacy checks |

This aligns with how the first administrator is stored and ensures **notifications** (e.g. code querying `users` by `schoolId`) can reach the new teacher.

### 5. Hand off access

Send the teacher the **staff login** URL and, if you did not set a known password, the password-reset flow. Share the **anonymous reporting link** for students: **`/report/{schoolId}`** (full production URL).

## Operator checklist (quick reference)

- [ ] First school created via **`/register`** or onboarding (school doc exists under **`schools`**).
- [ ] For extra teachers: **prefer** email invite from **Settings**; **otherwise** Auth user → **`schoolId` custom claim** → **`users`** + **`admins`** with matching **`schoolId` and `role` → user re-authenticates.
- [ ] Reporting link shared using the real **`schoolId`** from Firestore.
