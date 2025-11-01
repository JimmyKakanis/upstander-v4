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
        <div className="mt-8 text-sm">
          <p className="text-gray-600">
            Already submitted a report?{' '}
            <Link href="/follow-up" className="font-medium text-blue-600 hover:text-blue-500">
              Check its status here.
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
