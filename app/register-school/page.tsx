import Link from 'next/link';

export default function RegisterSchool() {
  return (
    <div className="bg-white">
      <div className="relative isolate px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-24 sm:py-32 lg:py-48 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Register Your School Today
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Join a growing network of schools committed to creating a safer, more supportive environment for every student.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/register" className="rounded-md bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              Get Started Now
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Why Register?</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Equip Your School with Powerful Tools
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-slate-900">
                  Easy Onboarding
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-slate-600">
                  <p className="flex-auto">
                    Set up your school profile in minutes. Invite your staff, define your reporting categories, and get started quickly.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-slate-900">
                  Cost-Effective
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-slate-600">
                  <p className="flex-auto">
                    We offer flexible plans designed for schools of all sizes. Contact us for district-wide pricing or specialized needs.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-slate-900">
                  Dedicated Support
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-slate-600">
                  <p className="flex-auto">
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
