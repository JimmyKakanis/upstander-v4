import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-20 sm:py-32">
      
      <div 
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-slate-50"
        style={{ zIndex: -1, clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0% 100%)' }}
      ></div>

      <h1 className="text-5xl sm:text-7xl font-bold text-slate-900 max-w-4xl">
        A Safer Way to Speak Up
      </h1>
      <p className="mt-6 text-lg text-slate-600 max-w-2xl">
        Upstander provides a secure and anonymous way for students to report bullying and other concerns, helping to create a safer school environment for everyone.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
        <Link 
          href="/follow-up" 
          className="w-full sm:w-auto inline-block py-3 px-8 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          Check a Report Status
        </Link>
        <Link 
          href="/report/MySchoolMVP" 
          className="w-full sm:w-auto inline-block py-3 px-8 border border-slate-300 rounded-lg shadow-sm text-base font-medium text-slate-700 bg-white hover:bg-slate-50 transition-all"
        >
          View Example Form
        </Link>
      </div>

    </div>
  );
}
