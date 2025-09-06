import ReportForm from "@/components/ReportForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 sm:p-24 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-8">
          Anonymous Bullying Report
        </h1>
        <ReportForm />
      </div>
    </main>
  );
}
