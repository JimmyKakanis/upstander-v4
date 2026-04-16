import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="bg-white">
      <div className="relative isolate">
        {/* Student-first hero */}
        <section className="bg-gradient-to-b from-blue-50 to-white border-b border-blue-100">
          <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28 lg:px-8 lg:py-36 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 sm:text-sm">
              For students
            </p>
            <h1 className="mt-4 font-sans text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.08] lg:text-6xl lg:leading-[1.06]">
              Report safely and anonymously
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9 max-w-2xl mx-auto">
              See something? Say something. You can report bullying or incidents at your school without sharing your
              identity. You do not have to face it alone.
            </p>
            <div className="mx-auto mt-10 flex w-full max-w-md flex-col items-stretch gap-4 sm:items-center">
              <Link
                href="/find-school"
                className="rounded-lg bg-blue-600 px-8 py-4 text-center text-base font-bold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:text-lg"
              >
                Find your school
              </Link>
              <Link
                href="/follow-up"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Check on an existing report
              </Link>
            </div>
          </div>
        </section>

        {/* Schools & teachers */}
        <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200/80 bg-slate-50/80 p-8 shadow-sm ring-1 ring-slate-900/5 sm:p-10">
            <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl text-center md:text-left">
              For schools and teachers
            </h2>
            <p className="mt-3 max-w-prose mx-auto md:mx-0 text-center md:text-left text-lg leading-8 text-slate-700">
              Create a safer school environment with reporting, tracking, and resolving incidents in one place.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
              <Link
                href="/register"
                className="inline-flex justify-center items-center rounded-md bg-slate-900 px-5 py-3.5 text-base font-bold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
              >
                Sign up your school
              </Link>
              <Link
                href="/demo"
                className="inline-flex justify-center items-center rounded-md border border-slate-200 bg-white px-5 py-3.5 text-base font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
              >
                View admin demo
              </Link>
              <Link
                href="/login"
                className="inline-flex justify-center items-center rounded-md border border-blue-200 bg-white px-5 py-3.5 text-base font-semibold text-blue-700 shadow-sm hover:bg-blue-50 sm:col-span-2 md:col-span-1"
              >
                Staff login
              </Link>
            </div>
            <div className="mt-8 border-t border-slate-200 pt-6 text-center md:text-left">
              <Link
                href="/for-educators"
                className="inline-flex items-center justify-center md:justify-start gap-1 text-base font-semibold text-blue-600 hover:text-blue-500"
              >
                Learn more for educators
                <span aria-hidden="true" className="text-lg leading-none">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Upstander */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Why choose Upstander?
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Built to bridge the gap between students and administration.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
              <div className="flex flex-col items-start">
                <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-900/10 w-full h-full p-6">
                  <dt className="font-sans text-lg font-semibold leading-7 text-slate-900">Anonymous reporting</dt>
                  <dd className="mt-2 font-sans text-sm leading-7 text-slate-600 sm:text-base">
                    Students can report incidents without fear of retaliation, encouraging open communication.
                  </dd>
                </div>
              </div>
              <div className="flex flex-col items-start">
                <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-900/10 w-full h-full p-6">
                  <dt className="font-sans text-lg font-semibold leading-7 text-slate-900">Secure dashboard</dt>
                  <dd className="mt-2 font-sans text-sm leading-7 text-slate-600 sm:text-base">
                    Admins can manage, track, and resolve cases efficiently with a purpose-built case management system.
                  </dd>
                </div>
              </div>
              <div className="flex flex-col items-start">
                <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-900/10 w-full h-full p-6">
                  <dt className="font-sans text-lg font-semibold leading-7 text-slate-900">Two-way communication</dt>
                  <dd className="mt-2 font-sans text-sm leading-7 text-slate-600 sm:text-base">
                    Chat with reporters to gather more details while strictly maintaining their anonymity.
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
