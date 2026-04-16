import Link from 'next/link';

export default function Footer() {
  const linkClass =
    'block w-full text-center text-sm font-medium text-slate-700 underline-offset-4 transition-colors hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:inline sm:w-auto sm:px-3 sm:py-2 sm:text-base sm:hover:underline';

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 font-sans">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Supporting student wellbeing
          </h3>

          <nav
            className="mt-10 grid w-full max-w-md grid-cols-2 justify-items-center gap-x-4 gap-y-3 sm:mt-12 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center sm:gap-x-1 sm:gap-y-1"
            aria-label="Footer"
          >
            <Link href="/for-educators" className={linkClass}>
              For educators
            </Link>
            <Link href="/for-parents" className={linkClass}>
              For parents
            </Link>
            <Link href="/login" className={linkClass}>
              Teacher admin login
            </Link>
            <Link href="/privacy-policy" className={linkClass}>
              Privacy policy
            </Link>
            <Link href="/register" className={`${linkClass} col-span-2 sm:col-span-1`}>
              Register my school
            </Link>
          </nav>

          <div className="mt-10 flex justify-center gap-5 border-t border-slate-200/90 pt-10 sm:mt-12 sm:pt-12">
            <a
              href="#"
              className="text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              aria-label="Facebook"
            >
              <svg fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
            <a
              href="#"
              className="text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              aria-label="YouTube"
            >
              <svg fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.498-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
