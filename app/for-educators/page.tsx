import Link from 'next/link';

export default function ForEducators() {
  return (
    <div className="bg-white">
      <div className="relative isolate border-b border-slate-100 px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:py-28">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Educators</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Empowering educators to create safer schools
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Upstander provides the tools you need to identify, track, and resolve bullying incidents effectively, fostering a culture of safety and support.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-x-6">
              <Link href="/register" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                Register your school
              </Link>
              <Link href="/demo" className="text-sm font-semibold text-slate-800 hover:text-blue-700">
                View admin demo <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-600">Complete management</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to manage student safety
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Our platform is designed with input from educators and administrators to streamline the reporting process and ensure no student falls through the cracks.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col rounded-xl border border-slate-200/80 bg-slate-50/50 p-6 ring-1 ring-slate-900/5">
              <dt className="text-base font-semibold leading-7 text-slate-900">
                Anonymous reporting
              </dt>
              <dd className="mt-4 text-base leading-7 text-slate-600">
                <p>
                  Students are often afraid to speak up. Our anonymous reporting tool removes that barrier, allowing you to hear about incidents you might otherwise miss.
                </p>
              </dd>
            </div>
            <div className="flex flex-col rounded-xl border border-slate-200/80 bg-slate-50/50 p-6 ring-1 ring-slate-900/5">
              <dt className="text-base font-semibold leading-7 text-slate-900">
                Case management dashboard
              </dt>
              <dd className="mt-4 text-base leading-7 text-slate-600">
                <p>
                  Track every report from submission to resolution. Assign status, add notes, and collaborate with your team to ensure every case is handled properly.
                </p>
              </dd>
            </div>
            <div className="flex flex-col rounded-xl border border-slate-200/80 bg-slate-50/50 p-6 ring-1 ring-slate-900/5">
              <dt className="text-base font-semibold leading-7 text-slate-900">
                Two-way communication
              </dt>
              <dd className="mt-4 text-base leading-7 text-slate-600">
                <p>
                  Need more information? Securely chat with the reporter to gather details while maintaining their anonymity, building trust and getting the full picture.
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Making a real difference</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Schools using Upstander report increased student engagement in safety and a more positive school climate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
