import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-xl font-bold text-yellow-500 mb-6">Supporting Student Wellbeing</h3>
          
          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8 text-sm font-medium text-slate-700">
            <Link href="/for-educators" className="hover:text-blue-600 transition-colors">
              For Educators
            </Link>
            <Link href="/for-parents" className="hover:text-blue-600 transition-colors">
              For Parents
            </Link>
            <Link href="/login" className="hover:text-blue-600 transition-colors">
              Teacher Admin Login
            </Link>
            <Link href="/privacy-policy" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/register" className="hover:text-blue-600 transition-colors">
              Register My School
            </Link>
          </nav>

          {/* Social Icons */}
          <div className="flex space-x-6">
            {/* Facebook Icon */}
            <a href="#" className="text-red-500 hover:text-red-600 transition-colors" aria-label="Facebook">
              <svg fill="currentColor" viewBox="0 0 24 24" className="h-8 w-8">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>

            {/* YouTube Icon */}
            <a href="#" className="text-red-500 hover:text-red-600 transition-colors" aria-label="YouTube">
              <svg fill="currentColor" viewBox="0 0 24 24" className="h-8 w-8">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.498-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
