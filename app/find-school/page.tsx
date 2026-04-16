import SchoolSearch from '@/components/search/SchoolSearch';
import Link from 'next/link';

export default function FindSchoolPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-white">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Students</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Find your school
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Search for your school to submit an anonymous bullying report.
        </p>
        <div className="mt-10">
          <SchoolSearch />
        </div>
        <div className="mt-10">
          <Link
            href="/follow-up"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Check on an existing report
          </Link>
        </div>
      </div>
    </div>
  );
}
