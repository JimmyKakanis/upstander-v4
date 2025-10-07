Anonymous Bullying Reporting App: MVP Specification
Project Goal: To create a secure, anonymous, and user-friendly platform for students to report incidents of bullying, initially for a single school, with the capability to scale to multiple schools in the future.

1. Core Student-Facing Features
Anonymous Reporting Form: A simple, intuitive form for students to submit reports. It must not require any personally identifiable information from the reporter.

Report Categories: Pre-defined categories of bullying (e.g., verbal, physical, cyber, social exclusion) to help structure the data.

Incident Details: Fields for date, time, location, description of the incident, and individuals involved (optional for the reporter to name).

Submission Confirmation: A confirmation screen with a unique, anonymous reference code after a report is submitted.

2. Core Admin Dashboard Features
Secure Login: A password-protected area for designated school staff to access the dashboard.

Report Management: A central view to see all submitted reports, with the ability to filter by status and date.

Report Status Tracking: A simple way for admins to mark reports as "New," "Under Investigation," or "Resolved."

Private Notes: A section within each report for staff to add timestamped, confidential notes on actions taken.

Basic Analytics: A simple dashboard view showing key metrics like the total number of reports and a breakdown of reports by category (e.g., a pie chart showing the percentage of verbal vs. physical vs. cyberbullying reports).

3. Security & Data Privacy
End-to-End Encryption: All data will be encrypted in transit and at rest.

Strict Access Control: Database rules will ensure only authenticated and authorized staff from a specific school can view that school's data. All data filtering is enforced on the server-side by these rules and cannot be bypassed by the client.

Anonymity by Design: The system will be built so that student reporters cannot be identified through the data they submit.

Compliance: The platform will be designed with the Australian Privacy Principles (APPs) in mind to protect sensitive student information.

4. Post-MVP / Future Considerations
Multi-Role Access: Creating different permission levels for staff (e.g., Wellbeing Coordinator, Year Level Coordinator, Principal).

Anonymous Two-Way Communication: A secure messaging feature allowing an admin to ask follow-up questions about a report without compromising the reporter's anonymity.

Resource Linking: Providing students with links to helpful resources (e.g., school counsellor booking page, online safety guides) after they submit a report.

5. Chosen Technology Stack
This stack is chosen for its rapid development speed, scalability, robust security, and its compatibility with AI-assisted coding tools.

Programming Language: TypeScript

Why: TypeScript is a superset of JavaScript that adds static typing. This helps catch errors early in development, leads to more reliable code, and is well-understood by AI coding assistants.

Frontend Framework: Next.js (using React)

Why: Next.js is a powerful framework for building modern, fast, and user-friendly web applications. It provides a great structure for building both the student-facing reporting form and the admin dashboard.

Backend & Database: Firebase (Google Cloud)

Why: As a "Backend-as-a-Service" (BaaS), Firebase provides a suite of tools that dramatically simplifies development.

Key Services to Use:

Firestore: A secure, real-time NoSQL database for storing the bullying reports. Its real-time nature means the admin dashboard will update instantly as new reports are submitted.

Firebase Authentication: To provide secure email and password login for school staff accessing the admin dashboard.

Firebase Hosting: For simple, fast, and secure deployment of the final web application.

Security Rules: To create a powerful layer of security, ensuring that only authenticated administrators can access the report data.