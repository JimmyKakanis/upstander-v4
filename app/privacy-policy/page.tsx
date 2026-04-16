export default function PrivacyPolicy() {
  return (
    <div className="bg-white px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-3xl text-base leading-7 text-slate-700">
        <p className="text-base font-semibold leading-7 text-blue-600">Upstander</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Privacy Policy</h1>
        
        <p className="mt-6 text-xl leading-8">
          Your privacy and the safety of student data are our top priorities. This policy outlines how we collect, use, and protect your information.
        </p>

        <div className="mt-10 max-w-2xl">
          <h2 className="mt-16 text-2xl font-bold tracking-tight text-slate-900">1. Information We Collect</h2>
          <p className="mt-6">
            <strong>Anonymous Reports:</strong> When a report is submitted, we do not collect personal identifiers unless the reporter voluntarily provides them. We may collect minimal metadata (timestamp, general device type) to ensure system functionality.
          </p>
          <p className="mt-6">
            <strong>School Administrator Data:</strong> To provide our service, we collect contact information (name, email, school affiliation) from authorized school personnel. This is used solely for account management and communication regarding the platform.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-slate-900">2. How We Use Information</h2>
          <ul role="list" className="mt-8 space-y-8 text-slate-600">
            <li className="flex gap-x-3">
              <span>
                <strong className="font-semibold text-slate-900">To Facilitate Reporting:</strong> The primary use of data is to deliver incident reports to the designated school administrators.
              </span>
            </li>
            <li className="flex gap-x-3">
              <span>
                <strong className="font-semibold text-slate-900">To Improve Safety:</strong> Aggregated, anonymized data may be used to identify trends and improve our tools, but individual reports remain confidential to the school.
              </span>
            </li>
          </ul>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-slate-900">3. Data Security</h2>
          <p className="mt-6">
            We implement industry-standard security measures to protect data against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit and at rest.
          </p>
          <p className="mt-6">
            Access to reports is restricted to authorized school personnel. We do not sell student or school data to third parties.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-slate-900">4. Compliance</h2>
          <p className="mt-6">
            Upstander is designed to help schools comply with relevant student privacy laws, including FERPA and COPPA. We work with educational institutions to ensure our practices align with their legal obligations.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-slate-900">5. Updates to This Policy</h2>
          <p className="mt-6">
            We may update this privacy policy from time to time. We will notify users of any significant changes by posting the new policy on this page.
          </p>
          
          <p className="mt-10 text-sm text-slate-500">
            Last Updated: February 2026
          </p>
        </div>
      </div>
    </div>
  );
}
