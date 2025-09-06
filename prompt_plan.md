
Prompt Plan for AI-Assisted Coding
This document provides a step-by-step plan of prompts to use with an AI coding assistant (like Gemini in Cursor) to build the Anonymous Bullying Reporting App.

Phase 1: Project Setup
[x] Initial Command:

"Set up a new Next.js project using TypeScript and Tailwind CSS. Initialize Firebase within this project. Create a .env.local file to store the Firebase configuration keys."

Phase 2: Building the Reporting Form (Student-facing)
[x] Create the Form Component:

"Create a new page component in Next.js for a student reporting form. The form must be anonymous. It should include a dropdown for 'Type of Bullying' (with options: Verbal, Physical, Cyber, Social Exclusion), a text area for 'Description of Incident', and optional input fields for 'Date', 'Time', and 'Location'."

[x] Style the Form:

"Style the form using Tailwind CSS to be clean, simple, and fully responsive on mobile devices. Ensure the input fields are clear and the submit button is prominent. Add loading and error states for the form submission process."

[x] Implement Form Submission Logic:

"Write the function that triggers on form submission. This function should take the form data and save it as a new document in a Firestore collection named 'reports'. Each document must include a 'status' field set to 'new', a 'createdAt' timestamp, and a 'schoolId' field hardcoded to 'MySchoolMVP' for now."

[x] Add Submission Confirmation:

"After a successful form submission, display a confirmation message to the student. Also, generate a unique, non-identifiable reference code for the report (e.g., 'FR2025-A8B2') and show it to the student. Explain that they can use this code if they need to talk to a staff member about the report later without revealing their identity."

Phase 3: Building the Admin Dashboard (Staff-facing)
[x] Set Up Authentication:

"Using Firebase Authentication, create a login page for school staff with email and password sign-in functionality."

[x] Create the Protected Dashboard:

"Create a protected admin dashboard page. This page should only be accessible to logged-in users. If a non-authenticated user tries to access it, they must be redirected to the login page."

[x] Display Reports:

"On the admin dashboard, write a function to fetch and display all documents from the 'reports' collection in Firestore where 'schoolId' matches 'MySchoolMVP'. Display the reports in a table with columns for 'Date', 'Type of Bullying', and 'Status'."

[x] Add Filtering and Sorting:

"On the admin dashboard, add dropdown filters to sort the reports by 'Status' (New, Under Investigation, Resolved) and to sort by 'Date' (Newest First, Oldest First)."

[x] Implement Report Management:

"When an administrator clicks on a report in the table, display its full details in a modal or a separate view. Add buttons within this view that allow the admin to update the report's status to 'Under Investigation' or 'Resolved'. Write the Firestore function that updates the 'status' field for the specific document in the database."

[ ] Add Private Admin Notes:

"In the report details view for admins, add a private 'Notes' section. This should be a text area where an admin can add and save timestamped notes about their investigation. These notes should be saved to the same Firestore document for that report and should only be visible on the admin dashboard."

Phase 4: Security & Scalability Prep
[ ] Define Security Rules:

"Write the Firestore security rules for this application. The rules must ensure that: 1) anyone can write (create) a new report to the 'reports' collection, 2) only authenticated users (admins) can read reports from their assigned school, and 3) only authenticated users can update the 'status' and 'notes' fields of a report."

[ ] Prepare for Multiple Schools:

"Refactor the code that uses the hardcoded 'MySchoolMVP' schoolId. Create a system where each logged-in admin's account in Firebase Authentication is associated with a specific schoolId. The dashboard should then only fetch reports matching that admin's schoolId. This will prepare the app for onboarding multiple schools."

Phase 5: Deployment
[x] Push to GitHub:

"Run the following commands in your local terminal to push the project to your GitHub repository:"
```bash
git add .
git commit -m "Initial commit of Upstander app"
git push -u origin main
```

[x] Deploy to Vercel:

"Once the code is on GitHub, the next step is to connect the repository to a new Vercel project to deploy it live."