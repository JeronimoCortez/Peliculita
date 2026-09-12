"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, signInWithGoogle } from "@/lib/auth";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const result = mode === "login" ? await loginUser(email, password) : await registerUser(email, password);

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.requiresEmailConfirmation) {
      setInfo("Te enviamos un email para confirmar tu cuenta. Confirmalo y después iniciá sesión.");
      return;
    }
    router.push("/");
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setGoogleSubmitting(false);
      setError("No pudimos iniciar sesión con Google. Probá de nuevo.");
      console.error(err);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-bold text-peli-accent">Peliculita</h1>
      <p className="mb-6 text-sm text-gray-400">
        {mode === "login" ? "Iniciá sesión para ver tus recomendaciones." : "Creá tu cuenta para empezar."}
      </p>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-peli-card px-4 py-2 text-sm font-medium text-gray-100 hover:border-white/40 disabled:opacity-40"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.9c1.7-1.57 2.7-3.87 2.7-6.64z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.27c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34C2.44 15.98 5.48 18 9 18z" />
          <path fill="#FBBC05" d="M3.95 10.69A5.4 5.4 0 013.68 9c0-.59.1-1.16.27-1.69V4.97H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.03l2.99-2.34z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z" />
        </svg>
        {googleSubmitting ? "Conectando…" : "Continuar con Google"}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-gray-500">
        <span className="h-px flex-1 bg-white/10" />
        o con tu email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-xs text-gray-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-white/15 bg-peli-card px-3 py-2 text-sm outline-none focus:border-peli-accent"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-xs text-gray-400">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-white/15 bg-peli-card px-3 py-2 text-sm outline-none focus:border-peli-accent"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-emerald-400">{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-peli-accent px-4 py-2 text-sm font-medium hover:bg-peli-accentHover disabled:opacity-40"
        >
          {submitting ? "Un momento…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-400">
        {mode === "login" ? (
          <>
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="text-peli-accent hover:underline">
              Registrate
            </Link>
          </>
        ) : (
          <>
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-peli-accent hover:underline">
              Iniciá sesión
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
