import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Resend } from "resend";
import * as dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.GCLOUD_PROJECT}` });

admin.initializeApp();

const db = admin.firestore();

export const onReportCreated = functions.firestore
  .document("reports/{reportId}")
  .onCreate(async (snap: functions.firestore.DocumentSnapshot) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
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

      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const user = userDoc.data();

        if (user.role === "admin") {
          const settingsRef = db
            .collection("users")
            .doc(userDoc.id)
            .collection("adminSettings")
            .doc("notifications");
          const settingsSnap = await settingsRef.get();

          let notify = true;
          if (settingsSnap.exists) {
            const settings = settingsSnap.data();
            if (settings && settings.newReports === false) {
              notify = false;
            }
          }

          if (notify) {
            console.log(`Sending new report notification to ${user.email}`);
            const { data, error } = await resend.emails.send({
              from: "Upstander <noreply@upstander.help>",
              to: user.email,
              subject: "New Report Submitted",
              html: "<p>A new report has been submitted for your school. You can view the report in your admin dashboard.</p>",
            });

            if (error) {
              console.error(`Error response from Resend for ${user.email}:`, error);
            } else {
              console.log(`Successfully sent email to ${user.email}, response:`, data);
            }
          }
        }
      });
      await Promise.all(promises);
    } catch (error) {
      console.error("Error sending new report notifications:", error);
    }
  });
