import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="bg-white">
      <div className="relative isolate">
        {/* Split Hero Section */}
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
          
          {/* Student Section (Left) */}
          <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:flex-auto lg:w-1/2 mb-16 lg:mb-0">
            <div className="bg-blue-50 rounded-2xl p-8 sm:p-10 text-center lg:text-left border border-blue-100">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                I am a Student
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                See something? Say something. Safely and anonymously report bullying or incidents at your school. You don't have to face it alone.
              </p>
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-x-6">
                <Link 
                  href="/find-school" 
                  className="rounded-md bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 w-full sm:w-auto text-center"
                >
                  Find Your School
                </Link>
              </div>
            </div>
          </div>

          {/* School/Teacher Section (Right) */}
          <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:flex-auto lg:w-1/2">
             <div className="bg-gray-50 rounded-2xl p-8 sm:p-10 text-center lg:text-left border border-gray-200">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                For Schools & Teachers
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Create a safer school environment with our complete platform for reporting, tracking, and resolving incidents.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  href="/register" 
                  className="rounded-md bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 w-full sm:w-auto text-center"
                >
                  Sign Up Your School
                </Link>
                <Link 
                  href="/demo" 
                  className="text-sm font-semibold leading-6 text-gray-900 border border-gray-300 px-5 py-3.5 rounded-md hover:bg-white w-full sm:w-auto text-center"
                >
                  View Admin Demo
                </Link>
              </div>
              <div className="mt-6 text-center lg:text-left">
                  <span className="text-sm text-gray-500">Already have an account? </span>
                  <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                    Log in here
                  </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Why Upstander Section */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
            <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Why Choose Upstander?</h2>
                <p className="mt-2 text-lg leading-8 text-gray-600">
                  Built to bridge the gap between students and administration.
                </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
                    <div className="flex flex-col items-start">
                        <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-900/10 w-full h-full p-6">
                             <dt className="text-base font-semibold leading-7 text-gray-900">Anonymous Reporting</dt>
                             <dd className="mt-2 text-base leading-7 text-gray-600">Students can report incidents without fear of retaliation, encouraging open communication.</dd>
                        </div>
                    </div>
                    <div className="flex flex-col items-start">
                         <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-900/10 w-full h-full p-6">
                            <dt className="text-base font-semibold leading-7 text-gray-900">Secure Dashboard</dt>
                            <dd className="mt-2 text-base leading-7 text-gray-600">Admins can manage, track, and resolve cases efficiently with a purpose-built case management system.</dd>
                        </div>
                    </div>
                    <div className="flex flex-col items-start">
                        <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-900/10 w-full h-full p-6">
                            <dt className="text-base font-semibold leading-7 text-gray-900">Two-Way Communication</dt>
                            <dd className="mt-2 text-base leading-7 text-gray-600">Chat with reporters to gather more details while strictly maintaining their anonymity.</dd>
                        </div>
                    </div>
                </dl>
            </div>
        </div>
      </div>
    </div>
  );
}
