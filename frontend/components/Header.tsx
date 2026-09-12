"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, type AuthUser } from "@/lib/auth";
import { resetCurrentUserData } from "@/lib/api";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      pathname === href ? "bg-peli-accent text-white" : "text-gray-300 hover:text-white hover:bg-white/5"
    }`;

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  function handleResetData() {
    if (!confirm("¿Borrar tu perfil y recomendaciones guardadas? Tu cuenta se mantiene.")) return;
    resetCurrentUserData();
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-peli-bg/95 px-4 py-3 backdrop-blur">
      <Link href="/feed" className="text-xl font-bold tracking-tight text-peli-accent">
        Peliculita
      </Link>
      <nav className="flex flex-wrap items-center gap-2">
        <Link href="/feed" className={linkClass("/feed")}>
          Para ti
        </Link>
        <Link href="/chat" className={linkClass("/chat")}>
          Chat
        </Link>
        <Link href="/onboarding" className={linkClass("/onboarding")}>
          Mi perfil
        </Link>
        {user && <span className="ml-2 hidden text-xs text-gray-500 sm:inline">{user.email}</span>}
        <button type="button" onClick={handleResetData} className="rounded-md px-3 py-2 text-sm text-gray-500 hover:text-gray-300">
          Borrar mis datos
        </button>
        <button type="button" onClick={handleLogout} className="rounded-md border border-white/15 px-3 py-2 text-sm text-gray-300 hover:border-white/40">
          Cerrar sesión
        </button>
      </nav>
    </header>
  );
}
