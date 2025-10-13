import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 sm:p-8">
      <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-center">
        
        <div className="flex justify-center mb-6">
            <Image src="/globe.svg" alt="Upstander" width={48} height={48} />
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to Upstander</h1>
        <p className="text-slate-600 mb-8">Anonymous Bullying Reporting for Your School Community.</p>
        
        <div className="space-y-4 bg-slate-50 p-6 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-700">
              To submit a new report, please use the unique URL provided by your school.
            </p>
            <p>
              <Link href="/report/MySchoolMVP" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Example Link to a School Report Form
              </Link>
            </p>
        </div>

        <div className="mt-8 border-t pt-8">
            <p className="mb-4 text-sm text-slate-700">
              Already submitted a report? Check its status or add to the conversation here:
            </p>
            <Link href="/follow-up" className="inline-block w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                Check Report Status
            </Link>
        </div>
      </div>
    </main>
  );
}
