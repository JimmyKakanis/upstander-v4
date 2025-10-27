import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Resend } from "resend";

admin.initializeApp();

const db = admin.firestore();
const resend = new Resend(functions.config().resend.api_key);

export const onReportCreated = functions.firestore
  .document("reports/{reportId}")
  .onCreate(async (snap: functions.firestore.DocumentSnapshot) => {
    const report = snap.data();

    if (!report) {
      console.log("No data associated with the event");
      return;
    }

    const schoolId = report.schoolId;

    console.log(`Querying for users with schoolId: "${schoolId}"`);

    try {
      const usersSnapshot = await db.collection("users").where("schoolId", "==", schoolId).get();

      if (usersSnapshot.empty) {
        console.log("No matching users found");
        return;
      }

      usersSnapshot.forEach(async (userDoc) => {
        const user = userDoc.data();
        
        if (user.role === "admin") {
          const settingsRef = db.collection("users").doc(userDoc.id).collection("adminSettings").doc("notifications");
          const settingsSnap = await settingsRef.get();
          
          let notify = true;
          if (settingsSnap.exists) {
            const settings = settingsSnap.data();
            if (settings && settings.newReports === false) {
              notify = false;
            }
          }

          if (notify) {
            await resend.emails.send({
              from: "Upstander <noreply@upstander.app>",
              to: user.email,
              subject: "New Report Submitted",
              html: "<p>A new report has been submitted for your school. You can view the report in your admin dashboard.</p>",
            });
          }
        }
      });
    } catch (error) {
      console.error("Error sending new report notifications:", error);
    }
  });
