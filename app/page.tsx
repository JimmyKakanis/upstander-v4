import ReportForm from "@/components/ReportForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-lg shadow-sm text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Upstander</h1>
        <p className="mb-8">Anonymous Bullying Reporting for Schools.</p>
        <p>
          To submit a report, please use the unique URL provided by your school.
        </p>
        <div className="mt-8">
            <a href="/report/MySchoolMVP" className="text-indigo-600 hover:text-indigo-800">
                Example Link to MySchoolMVP Report Form
            </a>
        </div>
      </div>
    </main>
  );
}
