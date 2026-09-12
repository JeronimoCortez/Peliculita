"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { waitForAuthReady } from "@/lib/auth";
import * as store from "@/lib/store";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    waitForAuthReady().then((user) => {
      if (!active) return;
      if (!user) {
        router.replace("/login");
        return;
      }
      const profile = store.getProfile(user.id);
      if (profile?.onboarding_completed) {
        router.replace("/feed");
      } else {
        router.replace("/onboarding");
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-gray-400">Cargando Peliculita…</p>
    </main>
  );
}
