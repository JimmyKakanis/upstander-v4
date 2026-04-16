"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-slate-600 max-w-md text-center text-sm">{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
