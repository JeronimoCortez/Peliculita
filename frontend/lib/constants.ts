// Vocabulario controlado del POC Peliculita.
// Nota: este frontend corre sin backend (ver README) — el motor determinista
// vive en lib/engine.ts y opera sobre este mismo vocabulario.

export const MOODS = [
  "Romance_leve",
  "Romance_intenso",
  "Accion_pausa",
  "Accion_rapido",
  "Comedia",
  "Drama",
  "Suspenso",
] as const;
export type Mood = (typeof MOODS)[number];

export const MOOD_LABELS: Record<Mood, string> = {
  Romance_leve: "Romance liviano",
  Romance_intenso: "Romance intenso",
  Accion_pausa: "Acción con pausas",
  Accion_rapido: "Acción a mil",
  Comedia: "Comedia",
  Drama: "Drama",
  Suspenso: "Suspenso",
};

export const SITUATIONS = ["Solo", "Con_amigos", "Con_familia"] as const;
export type Situation = (typeof SITUATIONS)[number];

export const SITUATION_LABELS: Record<Situation, string> = {
  Solo: "Solo/a",
  Con_amigos: "Con amigos",
  Con_familia: "Con familia",
};

export const GENRES = [
  "Accion",
  "Comedia",
  "Drama",
  "Romance",
  "Suspenso",
  "Terror",
  "Ciencia_Ficcion",
  "Documental",
  "Animacion",
  "Fantasia",
] as const;
export type Genre = (typeof GENRES)[number];

export const THEMES = [
  "Amistad",
  "Familia",
  "Superacion",
  "Traicion",
  "Misterio_Policial",
  "Viaje",
  "Guerra",
  "Deporte",
  "Musica",
  "Politica",
] as const;
export type Theme = (typeof THEMES)[number];

export const RATING_CODES = ["ATP", "Mas_13", "Mas_16", "Mas_18"] as const;
export type RatingCode = (typeof RATING_CODES)[number];

export const VIOLENCE_LEVELS = [0, 1, 2] as const;

export const ROMANCE_TOLERANCE = ["leve", "intenso", "mixto"] as const;
export type RomanceTolerance = (typeof ROMANCE_TOLERANCE)[number];

export const ACTION_RHYTHM_PREFERENCE = ["pausa", "rapido", "mixto"] as const;
export type ActionRhythmPreference = (typeof ACTION_RHYTHM_PREFERENCE)[number];

export const USAGE_FREQUENCY = ["diaria", "semanal", "ocasional"] as const;
export type UsageFrequency = (typeof USAGE_FREQUENCY)[number];

export const FALLBACK_REASON_CODES = {
  NONE: "NONE",
  PROFILE_INCOMPLETE: "PROFILE_INCOMPLETE",
  LOW_COVERAGE_RELAXED_GENRE: "LOW_COVERAGE_RELAXED_GENRE",
  LOW_COVERAGE_RELAXED_MOOD: "LOW_COVERAGE_RELAXED_MOOD",
  LOW_COVERAGE_POPULAR: "LOW_COVERAGE_POPULAR",
  LOW_COVERAGE_CRITICAL: "LOW_COVERAGE_CRITICAL",
} as const;
export type FallbackReasonCode = (typeof FALLBACK_REASON_CODES)[keyof typeof FALLBACK_REASON_CODES];

// Umbrales mínimos de candidatos por escalón de fallback (feed vs chat).
export const MIN_CANDIDATES = {
  feed: { strict: 20, relaxed_mood: 8, relaxed_genre: 8, popular: 5, critical: 1 },
  chat: { strict: 3, relaxed_mood: 3, relaxed_genre: 3, popular: 3, critical: 1 },
} as const;

export const SCORING_VERSION = "v1";

export const WEIGHTS = {
  MOOD: 50,
  GENRE_THEME: 30,
  RESTRICTION: 15,
  POPULARITY: 5,
} as const;

export const ANALYTICS_EVENTS = {
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_COMPLETED: "onboarding_completed",
  RECOMMENDATION_FEED_REQUESTED: "recommendation_feed_requested",
  RECOMMENDATION_FEED_RENDERED: "recommendation_feed_rendered",
  MOOD_CHANGED: "mood_changed",
  CHAT_RECOMMENDATION_REQUESTED: "chat_recommendation_requested",
  CHAT_RECOMMENDATION_RENDERED: "chat_recommendation_rendered",
  FEEDBACK_RECORDED: "feedback_recorded",
  SESSION_HISTORY_VIEWED: "session_history_viewed",
  MOTOR_FALLBACK_TRIGGERED: "motor_fallback_triggered",
} as const;
