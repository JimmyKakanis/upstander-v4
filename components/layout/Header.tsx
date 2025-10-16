import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.svg" alt="Upstander Logo" width={140} height={36} />
            </Link>
          </div>
          <div className="flex items-center">
            <Link href="/login" className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 hover:border-slate-400 transition-colors">
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
