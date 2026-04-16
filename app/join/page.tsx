"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token =
    searchParams.get("token")?.trim() || searchParams.get("invite")?.trim() || "";

  const [message, setMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<"init" | "joining" | "done">("init");
  const joinStarted = useRef(false);

  useEffect(() => {
    if (!token) {
      setMessage("This link is missing the invitation code. Ask your school admin to resend the email.");
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        const returnTo = `/join?token=${encodeURIComponent(token)}`;
        const loginUrl = `/login?signup=true&redirect=${encodeURIComponent(returnTo)}`;
        router.replace(loginUrl);
        return;
      }

      if (joinStarted.current) return;
      joinStarted.current = true;
      setPhase("joining");
      setMessage(null);

      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/schools/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Could not join school");
        }
        await user.getIdToken(true);
        setPhase("done");
        router.replace("/admin/dashboard");
      } catch (e) {
        joinStarted.current = false;
        setPhase("init");
        setMessage(e instanceof Error ? e.message : "Something went wrong");
      }
    });

    return () => unsub();
  }, [token, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-sm ring-1 ring-slate-900/5">
        {phase === "joining" && (
          <p className="text-slate-700">Joining your school…</p>
        )}
        {phase === "init" && !message && (
          <p className="text-slate-600">Loading…</p>
        )}
        {message && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{message}</p>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200/80 bg-white p-6 text-center text-slate-600 shadow-sm ring-1 ring-slate-900/5">
            Loading…
          </div>
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
