// Cliente único de Supabase para el navegador. Auth real (Google OAuth) contra
// un proyecto de Supabase — ver lib/auth.ts para el wrapper de alto nivel.
"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Configuralas en frontend/.env.local (ver README.md)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
