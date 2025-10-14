# Upstander: Anonymous Bullying Reporting App

This is a [Next.js](https://nextjs.org) project for Upstander, an anonymous bullying reporting application. The goal of this application is to provide a safe and confidential way for students to report incidents of bullying, and a secure dashboard for school administrators to manage and address these reports.

## Core Features

- **Anonymous Reporting:** Students can submit reports without revealing their identity.
- **Secure Admin Dashboard:** School staff can log in to view and manage reports for their specific school.
- **Report Management:** Admins can view report details, update the status of an investigation, and add private notes.
- **Unique Reference Codes:** Each report is assigned a unique, non-identifiable code that students can use for follow-up conversations.
- **Anonymous Two-Way Communication:** A secure, real-time messaging feature that allows school staff to communicate with the student reporter without compromising the student's anonymity. Includes email notifications to alert students of new messages.
- **Interactive Analytics:** The admin dashboard includes an "At a Glance" section with clickable cards to quickly filter reports by status (e.g., New, Under Investigation) and a pie chart breaking down reports by category.

## Development & Deployment Workflow

**IMPORTANT:** The primary workflow for this project is to commit changes to the `main` branch on GitHub. This automatically triggers a new deployment on Vercel, where all testing and verification is conducted.

The application is live and continuously deployed. There is no local development environment (`localhost:3000`) used as part of the standard workflow.

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


### Important Notes for Developers

*   **Firestore Composite Indexes:** When adding or modifying queries in the application (e.g., in the admin dashboard) that involve multiple `where` clauses or a combination of `where` and `orderBy`, Firestore may require a composite index. If a query fails, check the browser's developer console for an error message from Firestore that includes a direct link to create the necessary index in the Firebase Console.
*   **Local Git Configuration:** During development, an issue was identified where the local Git repository was incorrectly initialized in the system's user home directory instead of the project directory. If you encounter `git` command failures related to permissions or unexpected files, ensure your commands are being run specifically within the project folder. The most reliable solution is to use the `-C` flag to specify the path, for example: `git -C "c:/Projects/upstander - v4" push origin main`.

## Deploy on Vercel

The application is automatically deployed from the `main` branch using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
