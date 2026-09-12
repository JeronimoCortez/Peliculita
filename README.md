# Peliculita — Frontend (POC)

Next.js (App Router) + React + TypeScript + Tailwind. Este entregable es
**únicamente el frontend**, según lo pedido: no hay backend Express en este
alcance. La excepción es la autenticación, que sí es real: login con Google
vía Supabase Auth (ver sección "Auth con Google" más abajo).

## Supuesto explícito de este alcance

Como no hay backend en este entregable, el motor de recomendación
determinista, el agente de chat rule-based y la persistencia corren
**del lado del cliente**:

- `lib/engine.ts` — motor de scoring 100% determinista (mismo diseño que se
  usaría en un backend: fórmula ponderada + escalera de fallback a
  populares). Sin ML, sin llamadas de red.
- `lib/chatAgent.ts` — agente rule-based de ~3 turnos, keyword matching sin
  NLP/ML.
- `lib/store.ts` — reemplaza a Supabase usando `localStorage` del navegador,
  con claves modeladas igual que las tablas originales (`user_profiles`,
  `recommendation_contexts`, `feedback_events`, `session_history`).
- `lib/api.ts` — capa de acceso con la misma forma de contrato que tendría
  un backend real (`saveOnboarding`, `requestFeed`, `requestChat`,
  `sendFeedback`, `getSessionHistory`, `rehydrateSessionHistory`). Migrar a
  un backend real es reemplazar el cuerpo de estas funciones por `fetch()`,
  sin tocar los componentes que las consumen.
- `lib/mockCatalog.ts` — catálogo curado de muestra (44 títulos) con
  variedad de moods, géneros, temas, rating y violencia para poder ejercitar
  tanto el camino estricto del motor como su escalera de fallback.

Esto es una decisión de alcance para poder demostrar el producto de punta a
punta sin backend, no un cambio de arquitectura: todo el vocabulario
(moods, situaciones, géneros, temas, rating codes) y la fórmula de scoring
son los mismos que usaría la versión con Supabase/Express.

## Auth (Supabase)

El login es real (Supabase Auth), con dos métodos disponibles en
`/login` y `/register`: **Google OAuth** y **email/contraseña**.
`lib/supabaseClient.ts` crea el cliente y `lib/auth.ts` expone
`signInWithGoogle`, `loginUser`, `registerUser`, `logoutUser` y
`getCurrentUser`. Todo el resto del producto (perfil, feed, chat) sigue
corriendo del lado del cliente contra `localStorage`, namespaced por el
`user.id` real que devuelve Supabase.

Si el proyecto de Supabase tiene activada la confirmación de email (default),
`registerUser` no abre sesión al toque: el usuario recibe un mail y recién
puede loguearse después de confirmar.

Para que funcione en un entorno nuevo:

1. **Proyecto de Supabase**: creá uno en supabase.com (o usá uno existente).
2. **Provider de Google en Supabase**: Authentication > Providers > Google,
   activalo y cargá el Client ID / Client Secret de un OAuth Client de tipo
   "Web application" creado en Google Cloud Console (APIs & Services >
   Credentials).
   - En ese OAuth Client de Google, agregá como *Authorized redirect URI* la
     URL de callback que muestra Supabase en esa misma pantalla (tiene la
     forma `https://<project-ref>.supabase.co/auth/v1/callback`).
3. **Redirect URLs de la app en Supabase**: Authentication > URL
   Configuration > Redirect URLs, agregá `http://localhost:3000/auth/callback`
   (y la URL equivalente de producción cuando exista).
4. **Variables de entorno**: copiá `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` desde Project Settings > API a
   `.env.local` (no se versiona; `.env` solo deja las claves
   declaradas como base).

El login con email/contraseña no necesita configuración adicional: Supabase
lo tiene activado por defecto (Authentication > Providers > Email).

Sin estos valores, `lib/supabaseClient.ts` tira un error explícito al
arrancar la app en vez de fallar en silencio.

## Cómo correr

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`. Te redirige a `/login`, donde iniciás sesión
con "Continuar con Google". El botón "Cerrar sesión" del header cierra la
sesión de Supabase; "Borrar mis datos" borra el perfil/recomendaciones de
`localStorage` sin tocar la cuenta.

## Flujos implementados

- **Onboarding** (`/onboarding`): wizard de 4 pasos (gustos, restricciones,
  contexto, confirmación) que persiste el perfil e incrementa
  `profile_version`.
- **Feed "Para ti"** (`/feed`): selector de mood + situación, grid tipo
  Netflix, estados `loading/error/empty`, explicación corta por película,
  like/dislike con re-rank incremental acotado al `recommendation_context_id`
  actual, y CTA "Ver la recomendación de antes" que valida `profile_version`
  antes de reusar el resultado guardado.
- **Chat** (`/chat`): agente de reglas que pregunta mood/situación si faltan
  (con quick replies) y devuelve 1-3 películas con explicación, en un máximo
  de ~3 turnos.

## Analytics

`lib/analytics.ts` emite por consola los mismos eventos definidos para el
producto completo: `onboarding_started`, `onboarding_completed`,
`recommendation_feed_requested`, `recommendation_feed_rendered`,
`mood_changed`, `chat_recommendation_requested`,
`chat_recommendation_rendered`, `feedback_recorded`,
`session_history_viewed`, `motor_fallback_triggered`.

## Fuera de alcance de este entregable

Backend Express, Supabase Postgres/RLS para datos de producto (perfil, feed,
feedback — hoy en `localStorage`), tests automatizados del motor y
trazabilidad persistente entre dispositivos — todo eso queda para cuando se
pida explícitamente el backend. Supabase Auth (Google) sí está implementado,
ver "Auth con Google" arriba.
