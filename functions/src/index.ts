import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { Resend } from "resend";
import * as logger from "firebase-functions/logger";
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ region: "australia-southeast1" });

admin.initializeApp();

const db = admin.firestore();

export const onReportCreated = onDocumentCreated("reports/{reportId}", async (event) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const snap = event.data;
  if (!snap) {
    logger.log("No data associated with the event");
    return;
  }
  const report = snap.data();
  const schoolId = report.schoolId;

  logger.log(`Querying for users with schoolId: "${schoolId}"`);

  try {
    const usersSnapshot = await db.collection("users").where("schoolId", "==", schoolId).get();

    if (usersSnapshot.empty) {
      logger.log("No matching users found");
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
          logger.log(`Sending new report notification to ${user.email}`);
          const { data, error } = await resend.emails.send({
            from: "Upstander <noreply@upstander.help>",
            to: user.email,
            subject: "New Report Submitted",
            html: "<p>A new report has been submitted for your school. You can view the report in your admin dashboard.</p>",
          });

          if (error) {
            logger.error(`Error response from Resend for ${user.email}:`, error);
          } else {
            logger.log(`Successfully sent email to ${user.email}, response:`, data);
          }
        }
      }
    });
    await Promise.all(promises);
  } catch (error) {
    logger.error("Error sending new report notifications:", error);
  }
});
