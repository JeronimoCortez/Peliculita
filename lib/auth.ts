// Auth real vía Supabase Auth: email/contraseña y Google OAuth.
// El resto del frontend (lib/api.ts, componentes) sigue leyendo la sesión con
// getCurrentUser() de forma síncrona, como antes: cacheamos el usuario en
// memoria a partir de la sesión de Supabase y lo mantenemos al día con
// onAuthStateChange. Las pantallas protegidas (RequireAuth) esperan a
// waitForAuthReady() antes de renderizar, así que cuando el resto del código
// llama a getCurrentUser() el cache ya está poblado.
"use client";

import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export interface AuthUser {
  id: string;
  email: string;
}

function mapUser(user: User | null | undefined): AuthUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? "" };
}

let cachedUser: AuthUser | null = null;
let readyPromise: Promise<AuthUser | null> | null = null;

function ensureListener(): Promise<AuthUser | null> {
  if (!readyPromise) {
    readyPromise = supabase.auth.getSession().then(({ data }) => {
      cachedUser = mapUser(data.session?.user);
      return cachedUser;
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      cachedUser = mapUser(session?.user);
    });
  }
  return readyPromise;
}

if (typeof window !== "undefined") {
  ensureListener();
}

// Resuelve cuando Supabase terminó de procesar la sesión inicial (incluyendo
// el redirect de OAuth, si vinimos de /auth/callback). Usar antes de decidir
// si redirigir a /login.
export function waitForAuthReady(): Promise<AuthUser | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  return ensureListener();
}

export function getCurrentUser(): AuthUser | null {
  return cachedUser;
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
  cachedUser = null;
}

export type AuthResult =
  | { ok: true; user: AuthUser; requiresEmailConfirmation?: boolean }
  | { ok: false; error: string };

function translateAuthError(message: string): string {
  const known: Record<string, string> = {
    "Invalid login credentials": "Email o contraseña incorrectos.",
    "User already registered": "Ya existe una cuenta con ese email.",
    "Email not confirmed": "Todavía no confirmaste tu email. Revisá tu bandeja de entrada.",
  };
  return known[message] || message;
}

export async function registerUser(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return { ok: false, error: "Completá email y contraseña." };
  if (password.length < 6) return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };

  const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });
  if (error) return { ok: false, error: translateAuthError(error.message) };
  if (!data.user) return { ok: false, error: "No pudimos crear la cuenta." };

  if (!data.session) {
    return { ok: true, user: mapUser(data.user) as AuthUser, requiresEmailConfirmation: true };
  }
  cachedUser = mapUser(data.user);
  return { ok: true, user: cachedUser as AuthUser };
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return { ok: false, error: "Completá email y contraseña." };

  const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
  if (error) return { ok: false, error: translateAuthError(error.message) };

  cachedUser = mapUser(data.user);
  return { ok: true, user: cachedUser as AuthUser };
}
