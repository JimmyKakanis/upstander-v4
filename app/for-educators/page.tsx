import Link from 'next/link';

export default function ForEducators() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Empowering Educators to Create Safer Schools
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Upstander provides the tools you need to identify, track, and resolve bullying incidents effectively, fostering a culture of safety and support.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/register" className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                Register Your School
              </Link>
              <Link href="/demo" className="text-sm font-semibold leading-6 text-slate-900">
                View Admin Demo <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Complete Management</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to manage student safety
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Our platform is designed with input from educators and administrators to streamline the reporting process and ensure no student falls through the cracks.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                Anonymous Reporting
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="flex-auto">
                  Students are often afraid to speak up. Our anonymous reporting tool removes that barrier, allowing you to hear about incidents you might otherwise miss.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                Case Management Dashboard
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="flex-auto">
                  Track every report from submission to resolution. Assign status, add notes, and collaborate with your team to ensure every case is handled properly.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                Two-Way Communication
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="flex-auto">
                  Need more information? Securely chat with the reporter to gather details while maintaining their anonymity, building trust and getting the full picture.
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Testimonial / Impact Section */}
      <div className="bg-slate-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Making a Real Difference</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Schools using Upstander report increased student engagement in safety and a more positive school climate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
