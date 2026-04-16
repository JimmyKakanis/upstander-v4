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
            // Check for existing active subscription
            const subsQuery = query(
                collection(db, 'users', currentUser.uid, 'subscriptions'), 
                where('status', 'in', ['active', 'trialing'])
            );
            const subsSnap = await getDocs(subsQuery);
            if (!subsSnap.empty) {
                router.push('/admin/dashboard');
            }
          } catch (err: any) {
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
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Choose a Plan
                </h2>
                <p className="mt-4 text-xl text-gray-500">
                    Start your journey with Upstander today.
                </p>
            </div>

            {error && (
                <div className="mt-8 max-w-md mx-auto bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                    {isCustomerMissing && (
                        <div className="mt-2">
                             <p className="text-sm mb-2">This usually happens if your account was created before the payment system was set up.</p>
                             <button 
                                onClick={handleResetAccount}
                                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                             >
                                Reset Account (Requires Signup)
                             </button>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
                {products.length === 0 ? (
                    <div className="col-span-full text-center">
                         <p className="text-gray-500">No active plans found. Please contact support or check back later.</p>
                    </div>
                ) : (
                    products.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white flex flex-col">
                            <div className="p-6 flex-grow">
                                <h2 className="text-lg leading-6 font-medium text-gray-900">{product.name}</h2>
                                <p className="mt-4 text-sm text-gray-500">{product.description}</p>
                                {product.prices?.map((price: any) => (
                                    <div key={price.id} className="mt-8">
                                        <span className="text-4xl font-extrabold text-gray-900">${(price.unit_amount / 100).toFixed(2)}</span>
                                        <span className="text-base font-medium text-gray-500">/{price.interval}</span>
                                        <button
                                            onClick={() => handleCheckout(price.id)}
                                            disabled={checkoutLoading !== null}
                                            className={`mt-8 block w-full border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center transition-colors ${
                                                checkoutLoading === price.id 
                                                ? 'bg-blue-400 cursor-not-allowed' 
                                                : checkoutLoading !== null 
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        >
                                            {checkoutLoading === price.id ? 'Preparing Checkout...' : 'Subscribe'}
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
