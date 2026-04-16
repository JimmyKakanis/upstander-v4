# Onboarding schools and staff

This guide describes how schools and administrators get onto Upstander **today**, including how to add **additional teachers** when there is no in-app “invite staff” feature yet.

## How the first administrator gets set up (self-serve)

Most schools start without manual Firebase data entry:

1. **Full registration** — Staff use **`/register`**. The app creates a Firebase Auth user, calls **`/api/schools/create`** to create a document in the **`schools`** collection, and writes **`schoolId`** on the user’s **`users/{uid}`** and **`admins/{uid}`** documents.
2. **Minimal path** — Staff use **`/login`** then **`/admin/onboarding`** (school name only). The same **`/api/schools/create`** endpoint creates the school and links the account.

Important details:

- **`schoolId` is the Firestore document ID** of the school (auto-generated). It is **not** a hand-chosen slug. The student reporting URL is **`/report/{schoolId}`** using that id.
- **Duplicate school names are blocked** at the API layer (normalized name + transaction). A second full **`/register`** for the *same* school display name will not create another school document.

After checkout / subscription steps, staff use **`/admin/dashboard`** as usual.

## Adding more teachers to the same school (no in-app invite yet)

The product **does not** currently include a dashboard action to invite or provision colleague accounts. Additional staff must be attached to the **existing** school using Firebase and Firestore.

### 1. Get the school id

In **Firebase Console → Firestore → `schools`**, find the school document. Its **document id** is the canonical **`schoolId`** every staff member for that school must share (same value already stored on the first admin’s **`users/{uid}`** document).

### 2. Create each additional teacher in Firebase Authentication

**Authentication → Users → Add user** (email + password or passwordless flow, per your policy). Copy the new user’s **UID**.

### 3. Set the `schoolId` custom claim (required for some Firestore rules)

Several rules (for example **report read/update** and **conversations**) compare **`request.auth.token.schoolId`** to the report’s **`schoolId`**. Staff must have a **custom user claim** whose `schoolId` field matches the school document id from step 1.

Set claims using the **Firebase Admin SDK** (small Node script, Cloud Function, or your ops tooling). Pseudocode:

```js
await admin.auth().setCustomUserClaims(uid, { schoolId: "<same-school-document-id>" });
```

The user must **sign out and sign in again** (or refresh their ID token) so the new claim appears on the token.

> **Note:** Older internal docs referenced `scripts/set-admin-claim.js`. That script is not part of this repository’s tracked files; use Admin SDK in your environment instead.

### 4. Create Firestore profile documents

For each new UID, create or update:

| Collection | Document id | Fields (minimum) |
|------------|-------------|------------------|
| **`users`** | `{uid}` | `email`, **`schoolId`** (same as step 1), `role`: `"admin"` (and any other fields you use, e.g. `displayName`) |
| **`admins`** | `{uid}` | Same **`schoolId`** and identity fields for compatibility with legacy dashboard checks |

This aligns with how the first administrator is stored and ensures **notifications** (e.g. Cloud Functions querying `users` by `schoolId`) can reach the new teacher.

### 5. Hand off access

Send the teacher:

- The **staff login** URL (your deployed domain + **`/login`**).
- Their **credentials** or password-reset flow, per your security policy.
- The **anonymous reporting link** for students: **`/report/{schoolId}`** (full URL on production).

## Operator checklist (quick reference)

- [ ] First school created via **`/register`** or onboarding (school doc exists under **`schools`**).
- [ ] For each extra teacher: Auth user created → **`schoolId` custom claim** set → **`users`** + **`admins`** docs with same **`schoolId`** → user re-authenticates.
- [ ] Reporting link shared using the real **`schoolId`** from Firestore.

## Future product direction

A self-serve **“Invite staff”** flow (email link or join code, server-side provisioning) would remove most of the manual steps above. Until that ships, this document is the source of truth for multi-teacher schools.
