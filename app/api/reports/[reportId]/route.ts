import { NextRequest, NextResponse } from 'next/server';
import { admin, auth, db } from '@/lib/firebase-admin';
import { assertSchoolAdmin } from '@/lib/server/school-staff-guard';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { reportId: string } };

/**
 * School admins only. Deletes the report, its follow-up access doc (by reference code), and
 * any stored conversation. Does not delete Firebase Auth users.
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    if (!admin.apps.length) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const authHeader = _req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await auth.verifyIdToken(authHeader.split('Bearer ')[1]);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const callerUid = decoded.uid;
    const reportId = typeof params?.reportId === 'string' ? params.reportId.trim() : '';
    if (!reportId) {
      return NextResponse.json({ error: 'Invalid report' }, { status: 400 });
    }

    const reportRef = db.collection('reports').doc(reportId);
    const reportSnap = await reportRef.get();
    if (!reportSnap.exists) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const data = reportSnap.data() as Record<string, unknown> | undefined;
    const reportSchool = typeof data?.schoolId === 'string' ? data.schoolId.trim() : '';
    if (!reportSchool) {
      return NextResponse.json({ error: 'Invalid report data' }, { status: 400 });
    }

    const perm = await assertSchoolAdmin(callerUid, reportSchool);
    if (!perm.ok) {
      return NextResponse.json({ error: perm.error }, { status: 403 });
    }

    const refCode = typeof data?.referenceCode === 'string' ? data.referenceCode.trim() : '';
    const convRef = db.collection('conversations').doc(reportId);
    const convSnap = await convRef.get();

    const batch = db.batch();
    if (refCode) {
      batch.delete(db.collection('followUpAccess').doc(refCode));
    }
    if (convSnap.exists) {
      batch.delete(convRef);
    }
    batch.delete(reportRef);
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/reports/[reportId]:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
