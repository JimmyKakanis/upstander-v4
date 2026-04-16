import Link from 'next/link';

export default function RegisterSchool() {
  return (
    <div className="bg-white">
      <div className="relative isolate border-b border-slate-100 px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-20 text-center sm:py-28 lg:py-32">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Schools</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Register your school today
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Join a growing network of schools committed to creating a safer, more supportive environment for every student.
          </p>
          <div className="mt-10 flex justify-center">
            <Link href="/register" className="rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              Get started
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-20 lg:px-8 lg:pb-24">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-600">Why register</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Equip your school with powerful tools
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col rounded-xl border border-slate-200/80 bg-slate-50/50 p-6 ring-1 ring-slate-900/5">
                <dt className="text-base font-semibold leading-7 text-slate-900">
                  Easy onboarding
                </dt>
                <dd className="mt-3 text-base leading-7 text-slate-600">
                  <p>
                    Set up your school profile in minutes. Invite your staff, define your reporting categories, and get started quickly.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col rounded-xl border border-slate-200/80 bg-slate-50/50 p-6 ring-1 ring-slate-900/5">
                <dt className="text-base font-semibold leading-7 text-slate-900">
                  Cost-effective
                </dt>
                <dd className="mt-3 text-base leading-7 text-slate-600">
                  <p>
                    We offer flexible plans designed for schools of all sizes. Contact us for district-wide pricing or specialized needs.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col rounded-xl border border-slate-200/80 bg-slate-50/50 p-6 ring-1 ring-slate-900/5">
                <dt className="text-base font-semibold leading-7 text-slate-900">
                  Dedicated support
                </dt>
                <dd className="mt-3 text-base leading-7 text-slate-600">
                  <p>
                    Our team is here to help you every step of the way, from initial setup to ongoing best practices for student safety.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
