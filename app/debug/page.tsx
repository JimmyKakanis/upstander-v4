"use client";

export default function DebugPage() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '1.2rem' }}>
      <h1>Environment Variable Test</h1>
      <p>This page checks if the Vercel environment variables are accessible by the application.</p>
      <hr style={{ margin: '1rem 0' }} />
      <p>
        <strong>NEXT_PUBLIC_FIREBASE_PROJECT_ID:</strong>
      </p>
      <div style={{ border: '1px solid #ccc', padding: '1rem', background: '#f5f5f5', marginTop: '0.5rem' }}>
        <pre>{projectId || "VARIABLE NOT FOUND"}</pre>
      </div>
    </div>
  );
}
