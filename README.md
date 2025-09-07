# Upstander: Anonymous Bullying Reporting App

This is a [Next.js](https://nextjs.org) project for Upstander, an anonymous bullying reporting application. The goal of this application is to provide a safe and confidential way for students to report incidents of bullying, and a secure dashboard for school administrators to manage and address these reports.

## Core Features

- **Anonymous Reporting:** Students can submit reports without revealing their identity.
- **Secure Admin Dashboard:** School staff can log in to view and manage reports for their specific school.
- **Report Management:** Admins can view report details, update the status of an investigation, and add private notes.
- **Unique Reference Codes:** Each report is assigned a unique, non-identifiable code that students can use for follow-up conversations.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Environment Variables

This project connects to a Firebase backend and requires environment variables to function correctly.

#### Local Development

For local development, create a file named `.env.local` in the root of the project. Copy the contents of `.env.example` (you may need to create this file if it doesn't exist) and fill in your Firebase project credentials. This file is ignored by Git and should not be committed to the repository.

```
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
```

#### Vercel Deployment

For the live deployment on Vercel, you **must** set the environment variables in the Vercel project settings:

1.  Go to your project dashboard on Vercel.
2.  Navigate to **Settings** > **Environment Variables**.
3.  Add each of the `NEXT_PUBLIC_` variables listed above with their corresponding values from your Firebase project.
4.  After adding or updating variables, you must **redeploy** your project for the changes to take effect.

### Firestore Security Rules

**Crucial:** Changes made to the `firestore.rules` file in this repository are **not** automatically deployed when you push to GitHub or deploy on Vercel. You must manually deploy the security rules from the Firebase Console.

1.  Go to your Firebase project.
2.  Navigate to **Cloud Firestore** > **Rules**.
3.  Copy the contents of the `firestore.rules` file from this repository.
4.  Paste the contents into the editor in the Firebase Console and click **Publish**.


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
