import { NextRequest, NextResponse } from 'next/server';
import { admin, auth, db } from '@/lib/firebase-admin';
import { isSchoolAdminRole } from '@/lib/staff-role';
import { hasDashboardAccessForUser } from '@/lib/server/subscription';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!admin.apps.length) {
      const isDev = process.env.NODE_ENV === 'development';
      return NextResponse.json(
        {
          error: isDev
            ? 'Server is missing Firebase Admin credentials.'
            : 'Service temporarily unavailable.',
        },
        { status: 503 }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decoded.uid;

    const userSnap = await db.collection('users').doc(uid).get();
    let schoolId: string | null = null;
    if (userSnap.exists) {
      const sid = userSnap.data()?.schoolId;
      if (typeof sid === 'string' && sid) schoolId = sid;
    }

    if (!schoolId) {
      const adminSnap = await db.collection('admins').doc(uid).get();
      if (adminSnap.exists) {
        const sid = adminSnap.data()?.schoolId;
        if (typeof sid === 'string' && sid) schoolId = sid;
      }
    }

    let schoolName: string | null = null;
    if (schoolId) {
      const schoolSnap = await db.collection('schools').doc(schoolId).get();
      if (schoolSnap.exists) {
        const n = schoolSnap.data()?.name;
        schoolName = typeof n === 'string' ? n : null;
      }
    }

    const hasSubscriptionAccess = await hasDashboardAccessForUser(db, uid);

    let role: string | null = null;
    if (userSnap.exists) {
      const r = userSnap.data()?.role;
      role = typeof r === 'string' ? r : null;
    }
    if (!role) {
      const adminSnap = await db.collection('admins').doc(uid).get();
      if (adminSnap.exists) {
        const r = adminSnap.data()?.role;
        if (typeof r === 'string' && r) role = r;
      }
    }

    const isSchoolAdmin = isSchoolAdminRole(role);

    return NextResponse.json({
      schoolId,
      schoolName,
      hasSubscriptionAccess,
      role,
      isSchoolAdmin,
    });
  } catch (error) {
    console.error('dashboard-bootstrap error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
