# Onboarding a New School

This guide outlines the steps required to add a new school to the Upstander application.

## 1. Gather School Information

You will need the following information from the new school:
*   **Full School Name:** (e.g., "Northwood High School")
*   **School ID:** A unique, URL-friendly identifier. This is typically the school's name in lowercase with hyphens instead of spaces (e.g., `northwood-high-school`).
*   **Administrator Emails:** A list of email addresses for the staff who will need access to the admin dashboard.

## 2. Create Administrator Accounts

For each administrator email, you need to create a user account in Firebase.

*   **Action:** In the Firebase Console, go to **Authentication** and add a new user with their email address and a temporary password.
*   **Copy the UID:** After creating the user, copy their unique User UID.

## 3. Set Custom Admin Claim

Each administrator must have a custom claim set on their account to link them to their school.

*   **Script:** `scripts/set-admin-claim.js`
*   **Command:** Run the following command from the project's root directory:
    ```bash
    node scripts/set-admin-claim.js <admin-uid> <school-id>
    ```

## 4. Create Firestore User Documents

To ensure administrators receive email notifications, they must have a corresponding document in the `users` collection in Firestore.

*   **Action:** Go to the **Firestore Database** in the Firebase Console and navigate to the `users` collection.
*   **Details:** Create a new document with the administrator's UID as the document ID. Add the following fields:
    *   `email`: The administrator's email address.
    *   `schoolId`: The school's unique ID.
    *   `role`: "admin"

## 5. Create Firestore Admin Documents

For the dashboard to recognize the user as an administrator, they must also have a document in the `admins` collection.

*   **Action:** Navigate to the `admins` collection in the Firestore Database.
*   **Details:** Create a new document, again using the administrator's UID as the document ID. Add the same fields as in the `users` collection.

## 6. Add School to Public Directory

To make the school appear in the homepage search bar, add it to the `schools` collection.

*   **Script:** `scripts/add-school.js`
*   **Command:** Run the following command from the project's root directory:
    ```bash
    node scripts/add-school.js <school-id> "<Full School Name>"
    ```

## 7. Provide Information to the School

Once the setup is complete, provide the school with:
*   Their unique reporting URL: `https://upstander.help/report/<school-id>`
*   The login credentials for their administrators.
