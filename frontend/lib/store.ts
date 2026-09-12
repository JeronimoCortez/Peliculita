// Persistencia local del POC (sin backend, ver README). Reemplaza a Supabase.
// Estructura de claves alineada 1:1 con las tablas del diseño original para que
// migrar a un backend real sea un cambio de implementación, no de contrato.
// Todo queda namespaced por userId (ver lib/auth.ts) para soportar múltiples
// cuentas en el mismo navegador sin mezclar datos.
"use client";

import type { CatalogMovie, FeedbackEvent, RecommendationContextRecord, SessionHistory, UserProfile } from "./types";
import { MOCK_CATALOG } from "./mockCatalog";

function keysFor(userId: string) {
  return {
    profile: `peliculita:user_profile:${userId}`,
    sessionHistory: `peliculita:session_history:${userId}`,
    contexts: `peliculita:recommendation_contexts:${userId}`,
    feedback: `peliculita:feedback_events:${userId}`,
  };
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCatalog(): CatalogMovie[] {
  return MOCK_CATALOG;
}

export function getProfile(userId: string): UserProfile | null {
  return read<UserProfile | null>(keysFor(userId).profile, null);
}

export function saveProfile(
  userId: string,
  input: Omit<UserProfile, "user_id" | "profile_version" | "onboarding_completed">
): UserProfile {
  const existing = getProfile(userId);
  const nextVersion = (existing?.profile_version || 0) + 1;
  const profile: UserProfile = {
    user_id: userId,
    profile_version: nextVersion,
    onboarding_completed: true,
    ...input,
  };
  write(keysFor(userId).profile, profile);
  return profile;
}

export function getSessionHistory(userId: string): SessionHistory | null {
  return read<SessionHistory | null>(keysFor(userId).sessionHistory, null);
}

function setSessionHistory(userId: string, history: SessionHistory) {
  write(keysFor(userId).sessionHistory, history);
}

function getContexts(userId: string): Record<string, RecommendationContextRecord> {
  return read<Record<string, RecommendationContextRecord>>(keysFor(userId).contexts, {});
}

function setContexts(userId: string, contexts: Record<string, RecommendationContextRecord>) {
  write(keysFor(userId).contexts, contexts);
}

export function getContext(userId: string, contextId: string): RecommendationContextRecord | null {
  return getContexts(userId)[contextId] || null;
}

export function saveContext(userId: string, context: RecommendationContextRecord, profileVersion: number) {
  const contexts = getContexts(userId);
  contexts[context.id] = context;
  setContexts(userId, contexts);

  setSessionHistory(userId, {
    last_recommendation_context_id: context.id,
    last_mood: context.mood,
    last_situation: context.situation,
    last_profile_version_saved: profileVersion,
    last_created_at: context.created_at,
  });
}

export function updateContextItems(userId: string, contextId: string, items: RecommendationContextRecord["items"]) {
  const contexts = getContexts(userId);
  const existing = contexts[contextId];
  if (!existing) return;
  contexts[contextId] = { ...existing, items };
  setContexts(userId, contexts);
}

function getFeedbackEvents(userId: string): FeedbackEvent[] {
  return read<FeedbackEvent[]>(keysFor(userId).feedback, []);
}

function setFeedbackEvents(userId: string, events: FeedbackEvent[]) {
  write(keysFor(userId).feedback, events);
}

// Upsert idempotente por (user_id, movie_id, mood, situation, recommendation_context_id).
// user_id queda dado por el namespacing de la clave en localStorage.
export function upsertFeedback(userId: string, event: FeedbackEvent): FeedbackEvent[] {
  const events = getFeedbackEvents(userId);
  const idx = events.findIndex(
    (e) => e.movie_id === event.movie_id && e.mood === event.mood && e.situation === event.situation && e.recommendation_context_id === event.recommendation_context_id
  );
  if (idx >= 0) {
    events[idx] = event;
  } else {
    events.push(event);
  }
  setFeedbackEvents(userId, events);
  return events;
}

// Borra los datos de producto (perfil, contextos, feedback, historial) de un usuario.
// No toca la cuenta (lib/auth.ts) ni cierra sesión.
export function resetUserData(userId: string) {
  Object.values(keysFor(userId)).forEach((k) => window.localStorage.removeItem(k));
}
