
// This script sets a custom user claim on a Firebase user.
// Custom claims are used in Security Rules to grant role-based access.
//
// HOW TO USE:
// 1. SET UP YOUR ENVIRONMENT:
//    - Make sure you have `firebase-admin` installed (`npm install firebase-admin`).
//    - You need a Firebase service account key. Go to your Firebase project settings,
//      find "Service accounts," and generate a new private key. Save the JSON file
//      as `service-account-key.json` in the root of this project.
//      IMPORTANT: DO NOT COMMIT THIS FILE TO GIT. Add it to your `.gitignore`.
//
// 2. FIND YOUR ADMIN USER UID:
//    - Go to the Firebase Console -> Authentication.
//    - Find your admin user and copy their UID.
//
// 3. RUN THE SCRIPT FROM YOUR TERMINAL:
//    - node scripts/set-admin-claim.js <your-admin-uid> <your-school-id>
//
//    - Example:
//      node scripts/set-admin-claim.js abc123xyz456 MySchoolMVP

const admin = require('firebase-admin');

// IMPORTANT: Path to your service account key JSON file
const serviceAccount = require('../service-account-key.json');

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get UID and schoolId from command-line arguments
const uid = process.argv[2];
const schoolId = process.argv[3];

if (!uid || !schoolId) {
  console.error('Error: Please provide a UID and a schoolId as command-line arguments.');
  console.error('Usage: node scripts/set-admin-claim.js <uid> <schoolId>');
  process.exit(1);
}

// Set the custom claim
admin.auth().setCustomUserClaims(uid, { schoolId: schoolId })
  .then(() => {
    console.log(`Success! Custom claim set for user: ${uid}`);
    console.log(`School ID: ${schoolId}`);
    console.log('The user must sign out and sign back in for the changes to take effect.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting custom claim:', error);
    process.exit(1);
  });
