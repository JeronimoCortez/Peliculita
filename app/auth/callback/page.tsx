"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { waitForAuthReady } from "@/lib/auth";
import * as store from "@/lib/store";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    waitForAuthReady().then((user) => {
      if (!active) return;
      if (!user) {
        setError(true);
        return;
      }
      const profile = store.getProfile(user.id);
      router.replace(profile?.onboarding_completed ? "/feed" : "/onboarding");
    });
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      {error ? (
        <div className="text-center">
          <p className="mb-4 text-sm text-red-400">No pudimos completar el inicio de sesión con Google.</p>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-white/40"
          >
            Volver al login
          </button>
        </div>
      ) : (
        <p className="text-gray-400">Conectando con Google…</p>
      )}
    </main>
  );
}
