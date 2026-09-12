// Capa "api" del frontend. Mismo contrato de la spec original (onboarding/save,
// recommendations/feed, recommendations/chat, feedback, session-history) pero
// resuelto localmente (sin backend). Pensada para que cambiar estas funciones
// por fetch() a un backend real no requiera tocar los componentes que las llaman.
"use client";

import { ANALYTICS_EVENTS, track } from "./analytics";
import { getCurrentUser } from "./auth";
import type { Mood, Situation } from "./constants";
import { SCORING_VERSION } from "./constants";
import { recommend } from "./engine";
import { handleTurn as chatHandleTurn } from "./chatAgent";
import { applyIncrementalRerank } from "./rerank";
import * as store from "./store";
import type {
  ChatTurnResult,
  ChatTurnState,
  FeedbackAction,
  RecommendationContextRecord,
  RecommendationResult,
  UserProfile,
} from "./types";

function requireUserId(): string {
  const user = getCurrentUser();
  if (!user) throw new Error("No hay sesión activa.");
  return user.id;
}

function inputHash(profileVersion: number, mood: Mood | null, situation: Situation | null) {
  return `${profileVersion}|${mood || ""}|${situation || ""}`;
}

export async function saveOnboarding(input: Omit<UserProfile, "user_id" | "profile_version" | "onboarding_completed">) {
  const userId = requireUserId();
  track(ANALYTICS_EVENTS.ONBOARDING_STARTED, { userId });
  const profile = store.saveProfile(userId, input);
  track(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, { userId, profile_version: profile.profile_version });
  return { profile };
}

export async function getProfile() {
  const userId = requireUserId();
  return { profile: store.getProfile(userId) };
}

function persistContext(userId: string, mood: Mood | null, situation: Situation, profile: UserProfile | null, result: RecommendationResult) {
  const context: RecommendationContextRecord = {
    id: (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `ctx-${Date.now()}-${Math.random()}`),
    user_id: userId,
    scoring_version: SCORING_VERSION,
    input_hash: inputHash(profile?.profile_version || 0, mood, situation),
    mood,
    situation,
    created_at: new Date().toISOString(),
    ...result,
  };
  store.saveContext(userId, context, profile?.profile_version || 0);

  if (result.fallback_used) {
    track(ANALYTICS_EVENTS.MOTOR_FALLBACK_TRIGGERED, { userId, fallback_reason_code: result.fallback_reason_code });
  }

  return context;
}

export async function requestFeed({ mood, situation }: { mood: Mood | null; situation: Situation }) {
  const userId = requireUserId();
  track(ANALYTICS_EVENTS.RECOMMENDATION_FEED_REQUESTED, { userId, mood, situation });

  const profile = store.getProfile(userId);
  const catalog = store.getCatalog();
  const result = recommend({ catalog, profile, mood, situation, surface: "feed" });
  const context = persistContext(userId, mood, situation, profile, result);

  track(ANALYTICS_EVENTS.RECOMMENDATION_FEED_RENDERED, {
    userId,
    count: result.items.length,
    fallback_used: result.fallback_used,
  });

  return {
    recommendation_context_id: context.id,
    items: result.items,
    fallback_used: result.fallback_used,
    fallback_reason_code: result.fallback_reason_code,
  };
}

export async function requestChat({ message, turnState }: { message: string; turnState: ChatTurnState }): Promise<ChatTurnResult> {
  const userId = requireUserId();
  track(ANALYTICS_EVENTS.CHAT_RECOMMENDATION_REQUESTED, { userId, message });

  const profile = store.getProfile(userId);
  const catalog = store.getCatalog();
  const turnResult = chatHandleTurn({ message, turnState, catalog, profile });

  if (turnResult.type === "recommendation") {
    const context = persistContext(userId, turnResult.mood, turnResult.situation, profile, turnResult);
    track(ANALYTICS_EVENTS.CHAT_RECOMMENDATION_RENDERED, { userId, count: turnResult.items.length });
    return { ...turnResult, recommendation_context_id: context.id };
  }

  return turnResult;
}

export async function sendFeedback({
  movieId,
  mood,
  situation,
  recommendationContextId,
  action,
}: {
  movieId: string;
  mood: Mood | null;
  situation: Situation;
  recommendationContextId: string;
  action: FeedbackAction;
}) {
  const userId = requireUserId();

  store.upsertFeedback(userId, {
    movie_id: movieId,
    mood,
    situation,
    recommendation_context_id: recommendationContextId,
    action,
    created_at: new Date().toISOString(),
  });

  const context = store.getContext(userId, recommendationContextId);
  let updatedItems = null;

  if (context) {
    const catalog = store.getCatalog();
    const byId = new Map(catalog.map((m) => [m.id, m]));
    const enriched = context.items.map((item) => ({ ...item, movie: byId.get(item.movie_id) || { id: item.movie_id, mood_tags: [], genres: [] } }));
    const reranked = applyIncrementalRerank(enriched, movieId, action);
    updatedItems = reranked
      .map(({ movie, ...rest }) => rest)
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.movie_id.localeCompare(b.movie_id)));
    store.updateContextItems(userId, recommendationContextId, updatedItems);
  }

  track(ANALYTICS_EVENTS.FEEDBACK_RECORDED, {
    userId,
    movie_id: movieId,
    mood,
    situation,
    recommendation_context_id: recommendationContextId,
    action,
  });

  return { ok: true, updated_items: updatedItems };
}

export async function getSessionHistory() {
  const userId = requireUserId();
  track(ANALYTICS_EVENTS.SESSION_HISTORY_VIEWED, { userId });
  return { session_history: store.getSessionHistory(userId) };
}

// CTA "Ver la recomendación de antes" — invalida por profile_version, igual que la spec original.
export async function rehydrateSessionHistory() {
  const userId = requireUserId();
  const history = store.getSessionHistory(userId);
  if (!history || !history.last_recommendation_context_id) {
    return { stale: true as const, reason: "no_history" as const, items: null };
  }

  const profile = store.getProfile(userId);
  const currentVersion = profile?.profile_version ?? 0;

  if (currentVersion !== history.last_profile_version_saved) {
    return { stale: true as const, reason: "profile_version_mismatch" as const, items: null };
  }

  const context = store.getContext(userId, history.last_recommendation_context_id);
  if (!context) {
    return { stale: true as const, reason: "no_stored_result" as const, items: null };
  }

  return {
    stale: false as const,
    recommendation_context_id: context.id,
    mood: context.mood,
    situation: context.situation,
    items: context.items,
    fallback_reason_code: context.fallback_reason_code,
  };
}

export function resetCurrentUserData() {
  const userId = requireUserId();
  store.resetUserData(userId);
}
