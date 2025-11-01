import SchoolSearch from '@/components/search/SchoolSearch';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Upstander
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Anonymously report bullying and other incidents at your school.
        </p>
        <div className="mt-10">
          <SchoolSearch />
        </div>
        <div className="mt-8">
          <Link href="/follow-up" className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Check on an Existing Report
          </Link>
        </div>
      </div>
    </main>
  );
}
