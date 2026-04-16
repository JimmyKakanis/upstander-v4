import Link from 'next/link';

export default function ForParents() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Parents</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            A safer school experience for your child
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Bullying can happen when adults aren&apos;t watching. Upstander gives students a voice, ensuring they have a safe way to report incidents without fear.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2 lg:gap-10">
            
            <div className="flex flex-col">
              <h3 className="flex items-center gap-x-3 text-2xl font-semibold leading-7 text-slate-900">
                Why Anonymity Matters
              </h3>
              <div className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="flex-auto">
                  Many students witness bullying but stay silent because they fear retaliation or being labeled a "snitch." By removing names from initial reports, we empower bystanders to become "upstanders" and help their peers.
                </p>
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="flex items-center gap-x-3 text-2xl font-semibold leading-7 text-slate-900">
                How It Works
              </h3>
              <div className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="flex-auto">
                  1. <span className="font-semibold text-slate-900">Identify:</span> Your child sees something concerning.<br/>
                  2. <span className="font-semibold text-slate-900">Report:</span> They quickly submit a report through their school's secure Upstander portal.<br/>
                  3. <span className="font-semibold text-slate-900">Resolve:</span> School administrators receive the alert immediately and take action.
                </p>
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="flex items-center gap-x-3 text-2xl font-semibold leading-7 text-slate-900">
                Supporting Your Child
              </h3>
              <div className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="flex-auto">
                  Encourage open conversations about school safety. Let your child know that speaking up is the right thing to do, and tools like Upstander are there to protect them. If your school uses Upstander, make sure your child knows where to find the link.
                </p>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/80 to-white p-8 ring-1 ring-slate-900/5">
              <h3 className="flex items-center gap-x-3 text-2xl font-semibold leading-7 text-slate-900">
                Bring Upstander to your school
              </h3>
              <div className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="mb-6 flex-auto">
                  Is your child&apos;s school not using Upstander yet? Share our platform with school administrators or the PTA to help bring this vital safety tool to your community.
                </p>
                <Link href="/register-school" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                  Share registration link <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
