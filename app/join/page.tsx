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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md space-y-3">
        {phase === "joining" && (
          <p className="text-slate-700">Joining your school…</p>
        )}
        {phase === "init" && !message && (
          <p className="text-slate-600">Loading…</p>
        )}
        {message && <p className="text-red-700 text-sm">{message}</p>}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-slate-600">Loading…</p>
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
