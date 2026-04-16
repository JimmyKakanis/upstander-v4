import type { Firestore } from 'firebase-admin/firestore';

/**
 * True if any subscription subcollection doc under users/{uid}/subscriptions
 * or customers/{uid}/subscriptions has status active or trialing (case-insensitive).
 * Mirrors client-side logic in app/admin/dashboard/page.tsx without composite indexes.
 */
export async function hasActiveStripeSubscription(db: Firestore, uid: string): Promise<boolean> {
  const paths = [
    db.collection('users').doc(uid).collection('subscriptions'),
    db.collection('customers').doc(uid).collection('subscriptions'),
  ];

  for (const colRef of paths) {
    const snap = await colRef.get();
    for (const d of snap.docs) {
      const raw = d.data()?.status;
      const status = typeof raw === 'string' ? raw.toLowerCase() : '';
      if (status === 'active' || status === 'trialing') {
        return true;
      }
    }
  }
  return false;
}

/**
 * Dashboard billing: own subscription OR the school's billing owner's subscription.
 * Legacy schools may only have `createdBy`; treat as billing owner when `billingOwnerUid` is absent.
 */
export async function hasDashboardAccessForUser(db: Firestore, uid: string): Promise<boolean> {
  if (await hasActiveStripeSubscription(db, uid)) {
    return true;
  }

  const userSnap = await db.collection('users').doc(uid).get();
  const schoolId = userSnap.exists ? (userSnap.data()?.schoolId as string | undefined) : undefined;
  if (!schoolId || typeof schoolId !== 'string') {
    return false;
  }

  const schoolSnap = await db.collection('schools').doc(schoolId).get();
  if (!schoolSnap.exists) {
    return false;
  }

  const data = schoolSnap.data() as Record<string, unknown>;
  const billingOwner =
    (typeof data.billingOwnerUid === 'string' && data.billingOwnerUid) ||
    (typeof data.createdBy === 'string' && data.createdBy) ||
    null;

  if (!billingOwner || billingOwner === uid) {
    return false;
  }

  return hasActiveStripeSubscription(db, billingOwner);
}
