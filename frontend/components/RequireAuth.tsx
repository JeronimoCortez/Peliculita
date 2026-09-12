"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { waitForAuthReady } from "@/lib/auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    waitForAuthReady().then((user) => {
      if (!active) return;
      if (!user) {
        router.replace("/login");
        return;
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
