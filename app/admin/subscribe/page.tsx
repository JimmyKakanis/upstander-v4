"use client";

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, onSnapshot, getDoc, doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User, deleteUser, signOut } from 'firebase/auth';

export default function SubscribePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isCustomerMissing, setIsCustomerMissing] = useState(false);
  const router = useRouter();

  const handleResetAccount = async () => {
    if (!user) return;
    if (confirm("This will delete your current account and log you out. You will need to sign up again. Are you sure?")) {
        try {
            await deleteUser(user);
            router.push('/login');
        } catch (error: any) {
            console.error("Error deleting user:", error);
            if (error.code === 'auth/requires-recent-login') {
                alert("Please log out and log back in, then try again.");
                await signOut(auth);
                router.push('/login');
            } else {
                setError("Failed to delete account: " + error.message);
            }
        }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
          try {
            const idToken = await currentUser.getIdToken();
            const res = await fetch('/api/me/dashboard-bootstrap', {
              headers: { Authorization: `Bearer ${idToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.hasSubscriptionAccess === true) {
                router.push('/admin/dashboard');
              }
            }
          } catch (err: unknown) {
            console.error("Error checking subscription:", err);
          }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), where('active', '==', true));
        const querySnapshot = await getDocs(q);
        const productsData = [];
        for (const productDoc of querySnapshot.docs) {
          const product = { id: productDoc.id, ...productDoc.data() } as any;
          const priceSnap = await getDocs(collection(productDoc.ref, 'prices'));
          product.prices = priceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          productsData.push(product);
        }
        setProducts(productsData);
      } catch (error: any) {
        console.error("Error fetching products:", error);
        setError("Failed to load plans. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCheckout = async (priceId: string) => {
    setError(null);
    if (!user) {
        router.push('/login?redirect=/admin/subscribe');
        return;
    }

    setCheckoutLoading(priceId);

    try {
        const customerDocRef = doc(db, 'users', user.uid); // NOTE: Extension is configured to use 'users' collection
        let customerDoc = await getDoc(customerDocRef);
        
        // Retry logic for customer document
        let retries = 0;
        const maxRetries = 10;
        while ((!customerDoc.exists() || !customerDoc.data()?.stripeId) && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            customerDoc = await getDoc(customerDocRef);
            retries++;
        }

        if (!customerDoc.exists() || !customerDoc.data()?.stripeId) {
            console.error("Customer document/StripeID does not exist. The Stripe extension may not have created it yet.");
            setIsCustomerMissing(true);
            setCheckoutLoading(null);
            setError("Account setup incomplete. The payment system cannot process your request because your customer record is missing.");
            return;
        }

        const docRef = await addDoc(collection(db, 'users', user.uid, 'checkout_sessions'), {
            price: priceId,
            success_url: window.location.origin + '/admin/dashboard',
            cancel_url: window.location.origin + '/admin/subscribe',
        });
        
        onSnapshot(docRef, (snap) => {
            const data = snap.data();
            if (!data) return;
            
            const { error, url } = data;
            if (error) {
                console.error("Checkout session error:", error);
                setError(error.message);
                setCheckoutLoading(null);
            }
            if (url) {
                window.location.assign(url);
            }
        });
    } catch (error: any) {
        console.error("Error creating checkout session:", error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setCheckoutLoading(null);
    }
  };

  if (loading || authLoading) {
      return (
          <div className="flex min-h-[50vh] items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" aria-hidden />
              <span className="sr-only">Loading</span>
          </div>
      );
  }

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
            <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Subscription</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    Choose a plan
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
                    Start using Upstander with your school.
                </p>
            </div>

            {error && (
                <div className="relative mx-auto mt-8 max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800" role="alert">
                    <span className="block text-sm sm:inline">{error}</span>
                    {isCustomerMissing && (
                        <div className="mt-3 border-t border-red-200/80 pt-3">
                             <p className="mb-3 text-sm">This usually happens if your account was created before the payment system was set up.</p>
                             <button 
                                type="button"
                                onClick={handleResetAccount}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                             >
                                Reset account (requires signup)
                             </button>
                        </div>
                    )}
                </div>
            )}

            <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:mt-16 sm:grid-cols-2 lg:max-w-none xl:grid-cols-3">
                {products.length === 0 ? (
                    <div className="col-span-full text-center text-slate-500">
                         No active plans found. Please contact support or check back later.
                    </div>
                ) : (
                    products.map((product) => (
                        <div key={product.id} className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5">
                            <div className="flex-grow p-6 sm:p-8">
                                <h2 className="text-lg font-semibold text-slate-900">{product.name}</h2>
                                <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
                                {product.prices?.map((price: any) => (
                                    <div key={price.id} className="mt-8">
                                        <span className="text-4xl font-bold tabular-nums text-slate-900">${(price.unit_amount / 100).toFixed(2)}</span>
                                        <span className="text-base font-medium text-slate-500">/{price.interval}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCheckout(price.id)}
                                            disabled={checkoutLoading !== null}
                                            className={`mt-8 block w-full rounded-lg border border-transparent py-2.5 text-center text-sm font-semibold text-white transition-colors ${
                                                checkoutLoading === price.id 
                                                ? 'cursor-not-allowed bg-blue-400' 
                                                : checkoutLoading !== null 
                                                    ? 'cursor-not-allowed bg-slate-400'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        >
                                            {checkoutLoading === price.id ? 'Preparing checkout…' : 'Subscribe'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
}
