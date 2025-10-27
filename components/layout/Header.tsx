"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function Header() {
  const [user] = useAuthState(auth);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.svg" alt="Upstander Logo" width={140} height={36} />
            </Link>
          </div>
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/admin/dashboard" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                  Dashboard
                </Link>
                <Link href="/admin/settings" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 hover:border-slate-400 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 hover:border-slate-400 transition-colors">
                Staff Login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
