import { NextRequest, NextResponse } from 'next/server';
import { admin, db, auth } from '@/lib/firebase-admin';

class DuplicateUserSchoolError extends Error {
  readonly code = 'USER_ALREADY_HAS_SCHOOL';
}

class DuplicateSchoolNameError extends Error {
  readonly code = 'DUPLICATE_SCHOOL_NAME';
}

export async function POST(req: NextRequest) {
  try {
    if (!admin.apps.length) {
      console.error('Firebase Admin not initialized — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      const isDev = process.env.NODE_ENV === 'development';
      return NextResponse.json(
        {
          error: isDev
            ? 'Local server is missing Firebase Admin credentials. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env.local (service account JSON from Firebase Console). See README or .env.example.'
            : 'School setup is temporarily unavailable. Please try again later or contact support.',
        },
        { status: 503 }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const {
      schoolName,
      address,
      city,
      state,
      zip,
      studentCount,
      contactName,
      contactPhone,
    } = await req.json();

    if (!schoolName || typeof schoolName !== 'string' || !schoolName.trim()) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 });
    }

    const trimmed = schoolName.trim();
    const nameNormalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
    const parsedCount = parseInt(String(studentCount), 10);
    const studentCountNum = Number.isFinite(parsedCount) ? parsedCount : 0;

    let newSchoolId: string;
    try {
      newSchoolId = await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(userId);
        const adminRef = db.collection('admins').doc(userId);

        const userSnap = await t.get(userRef);
        if (userSnap.exists && userSnap.data()?.schoolId) {
          throw new DuplicateUserSchoolError();
        }

        const dupByNorm = await t.get(
          db.collection('schools').where('nameNormalized', '==', nameNormalized).limit(1)
        );
        if (!dupByNorm.empty) {
          throw new DuplicateSchoolNameError();
        }

        const dupByExactName = await t.get(
          db.collection('schools').where('name', '==', trimmed).limit(1)
        );
        if (!dupByExactName.empty) {
          throw new DuplicateSchoolNameError();
        }

        const schoolRef = db.collection('schools').doc();
        t.set(schoolRef, {
          name: trimmed,
          nameNormalized,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: userId,
          address: address || '',
          city: city || '',
          state: state || '',
          zip: zip || '',
          studentCount: studentCountNum,
        });

        t.set(
          userRef,
          {
            schoolId: schoolRef.id,
            displayName: contactName || '',
            phoneNumber: contactPhone || '',
            email: decodedToken.email,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        t.set(
          adminRef,
          {
            schoolId: schoolRef.id,
            email: decodedToken.email,
            displayName: contactName || '',
            phoneNumber: contactPhone || '',
          },
          { merge: true }
        );

        return schoolRef.id;
      });
    } catch (e: unknown) {
      if (e instanceof DuplicateUserSchoolError) {
        return NextResponse.json({ error: 'User already has a school' }, { status: 400 });
      }
      if (e instanceof DuplicateSchoolNameError) {
        return NextResponse.json(
          {
            error:
              'A school with this name is already registered. Sign in with your existing staff account, or use a slightly different name for testing.',
          },
          { status: 409 }
        );
      }
      throw e;
    }

    return NextResponse.json({ success: true, schoolId: newSchoolId }, { status: 200 });
  } catch (error) {
    console.error('Error creating school:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
