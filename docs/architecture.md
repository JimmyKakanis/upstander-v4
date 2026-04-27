# Architecture Overview

This document provides a high-level overview of the Upstander application's architecture.

## Frontend

*   **Framework:** [Next.js](https://nextjs.org/) (with React)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Deployment:** Vercel

The frontend is a modern server-side rendering (SSR) application built with Next.js. It is responsible for all user-facing pages, including the anonymous reporting form, the follow-up page, and the secure administrator dashboard.

**Layout and roles:** The marketing home page (`/`) is student-first (primary CTA to find a school and submit a report; secondary link to check an existing report). Staff sign-in and school registration are not shown in the global header when logged out; they appear on the home page, on dedicated routes (`/login`, `/register`), and in the site footer. See **[Technical details — Public UI and admin experience](./technical.md#public-ui-and-admin-experience)** for navigation, shared styling patterns, and where key components live.

## Backend & Database

*   **Provider:** [Firebase (Google Cloud)](https://firebase.google.com/)
*   **Services Used:**
    *   **Firestore:** A NoSQL database used to store all report data, school information, and user profiles.
    *   **Firebase Authentication:** Provides secure email and password login for school administrators.
    *   **Firebase Cloud Functions:** A serverless environment used for backend logic, most notably for sending email notifications when new reports are created.

### Staff accounts and multiple teachers per school

The **first** administrator is created through the app (**`/register`** or **`/admin/onboarding`** plus **`/api/schools/create`**). There is **no in-app “invite colleague”** UI yet; additional teachers must be provisioned in **Firebase Auth**, given the same **`schoolId`** in **`users`** / **`admins`**, and must have a matching **`schoolId` custom claim** on their ID token so Firestore security rules allow report access and updates. See **[Onboarding schools and staff](./onboarding.md)** for the full checklist.

## Email Notifications

*   **Provider:** [Resend](https://resend.com/)
*   **Trigger:** A Firebase Cloud Function (`onReportCreated`) is triggered whenever a new document is added to the `reports` collection in Firestore.
*   **Process:** The function identifies the correct school administrators to notify based on the `schoolId` and sends them an email via the Resend API.
*   **DNS:** The `upstander.help` domain has SPF and DKIM records configured to ensure high email deliverability and avoid spam folders.
