import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const db = admin.firestore();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { reportId, text, sender } = await req.json();

    if (!reportId || !text || !sender) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const conversationRef = db.collection('conversations').doc(reportId);
    const reportRef = db.collection('reports').doc(reportId);

    const message = {
      sender,
      text,
      timestamp: new Date(),
    };

    if (sender === 'admin') {
      const authToken = req.headers.get('Authorization')?.split('Bearer ')[1];
      if (!authToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      try {
        await admin.auth().verifyIdToken(authToken);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      const reportDoc = await reportRef.get();
      const reportData = reportDoc.data();

      if (reportData?.contactEmail) {
        try {
          await resend.emails.send({
            from: 'Upstander <noreply@upstander.help>',
            to: reportData.contactEmail,
            subject: 'You have a new message about your report',
            html: `<p>You have received a new message from a school administrator regarding your report. You can view the message by clicking here: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/follow-up/${reportId}">View Message</a></p>`,
          });
        } catch (emailError) {
          console.error('Resend API error:', emailError);
          // Non-fatal, so we'll just log it.
        }
      }
    } else if (sender === 'reporter') {
      const reportDoc = await reportRef.get();
      const reportData = reportDoc.data();

      if (reportData?.schoolId) {
        const schoolId = reportData.schoolId;
        const usersSnapshot = await db.collection("users").where("schoolId", "==", schoolId).get();

        if (!usersSnapshot.empty) {
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
                if (settings && settings.newMessages === false) {
                  notify = false;
                }
              }

              if (notify) {
                try {
                  console.log(`Sending new message notification to ${user.email}`);
                  await resend.emails.send({
                    from: 'Upstander <noreply@upstander.help>',
                    to: user.email,
                    subject: 'New Anonymous Message Received',
                    html: `<p>A new anonymous message has been received for report ${reportId}. You can view the message in your admin dashboard.</p>`,
                  });
                } catch (emailError) {
                  console.error('Resend API error:', emailError);
                }
              }
            }
          });
          await Promise.all(promises);
        }
      }
    }

    await conversationRef.set(
      {
        messages: admin.firestore.FieldValue.arrayUnion(message),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
