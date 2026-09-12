"use client";

import { useEffect, useState } from "react";
import MoodSelector from "./MoodSelector";
import SituationSelector from "./SituationSelector";
import MovieCard from "./MovieCard";
import { requestFeed, rehydrateSessionHistory, sendFeedback } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
import type { Mood, Situation } from "@/lib/constants";
import type { FallbackReasonCode } from "@/lib/constants";
import type { RecommendationItem } from "@/lib/types";
import * as store from "@/lib/store";

type Status = "loading" | "ready" | "error" | "empty";

const FALLBACK_MESSAGES: Record<FallbackReasonCode, string> = {
  NONE: "",
  PROFILE_INCOMPLETE: "Todavía no completaste tu perfil del todo: te mostramos lo más popular.",
  LOW_COVERAGE_RELAXED_GENRE: "No encontramos suficientes coincidencias exactas de género/tema: ampliamos por mood.",
  LOW_COVERAGE_RELAXED_MOOD: "No había suficiente contenido para ese mood: priorizamos tus géneros y temas.",
  LOW_COVERAGE_POPULAR: "Poca cobertura para tu combinación: te mostramos lo más popular dentro de tus restricciones.",
  LOW_COVERAGE_CRITICAL: "Cobertura muy baja en el catálogo: relajamos incluso las restricciones de seguridad.",
};

export default function Feed() {
  const [mood, setMood] = useState<Mood | null>(null);
  const [situation, setSituation] = useState<Situation>("Solo");
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [contextId, setContextId] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<FallbackReasonCode>("NONE");
  const [hasHistory, setHasHistory] = useState(false);

  async function loadFeed(nextMood: Mood | null, nextSituation: Situation) {
    setStatus("loading");
    try {
      const result = await requestFeed({ mood: nextMood, situation: nextSituation });
      setItems(result.items);
      setContextId(result.recommendation_context_id);
      setFallbackReason(result.fallback_reason_code);
      setStatus(result.items.length === 0 ? "empty" : "ready");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  useEffect(() => {
    const user = getCurrentUser();
    const historyExists = Boolean(user && store.getSessionHistory(user.id)?.last_recommendation_context_id);
    setHasHistory(historyExists);

    (async () => {
      // Al entrar al feed, primero intentamos retomar la última recomendación
      // guardada (venga del feed o del chat) en vez de pisarla con un cálculo
      // general nuevo; solo calculamos desde cero si no hay historial o quedó
      // invalidado por un cambio de profile_version.
      if (historyExists) {
        const result = await rehydrateSessionHistory();
        if (!result.stale && result.items) {
          setItems(result.items);
          setContextId(result.recommendation_context_id);
          setFallbackReason(result.fallback_reason_code);
          setMood(result.mood ?? null);
          setSituation(result.situation ?? "Solo");
          setStatus(result.items.length === 0 ? "empty" : "ready");
          return;
        }
      }
      await loadFeed(mood, situation);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMoodChange(next: Mood | null) {
    setMood(next);
    track(ANALYTICS_EVENTS.MOOD_CHANGED, { mood: next, situation });
    loadFeed(next, situation);
  }

  function handleSituationChange(next: Situation) {
    setSituation(next);
    loadFeed(mood, next);
  }

  async function handlePreviousRecommendation() {
    setStatus("loading");
    const result = await rehydrateSessionHistory();
    if (result.stale || !result.items) {
      await loadFeed(mood, situation);
      return;
    }
    setItems(result.items);
    setContextId(result.recommendation_context_id);
    setFallbackReason(result.fallback_reason_code);
    setMood(result.mood ?? null);
    setSituation(result.situation ?? "Solo");
    setStatus(result.items.length === 0 ? "empty" : "ready");
  }

  async function handleFeedback(movieId: string, action: "like" | "dislike") {
    if (!contextId) return;
    const { updated_items: updatedItems } = await sendFeedback({
      movieId,
      mood,
      situation,
      recommendationContextId: contextId,
      action,
    });
    if (updatedItems) setItems(updatedItems);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Para ti</h1>
        {hasHistory && (
          <button
            type="button"
            onClick={handlePreviousRecommendation}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-gray-300 hover:border-white/40"
          >
            Ver la recomendación de antes
          </button>
        )}
      </div>

      <div className="mb-3">
        <MoodSelector value={mood} onChange={handleMoodChange} />
      </div>
      <div className="mb-6">
        <SituationSelector value={situation} onChange={handleSituationChange} />
      </div>

      {fallbackReason !== "NONE" && status === "ready" && (
        <p className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
          {FALLBACK_MESSAGES[fallbackReason]}
        </p>
      )}

      {status === "loading" && <p className="text-sm text-gray-400">Cargando recomendaciones…</p>}
      {status === "error" && <p className="text-sm text-red-400">Ocurrió un error al calcular tu feed. Probá de nuevo.</p>}
      {status === "empty" && <p className="text-sm text-gray-400">No encontramos películas para mostrar todavía.</p>}

      {status === "ready" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <MovieCard key={item.movie_id} item={item} onFeedback={handleFeedback} />
          ))}
        </div>
      )}
    </div>
  );
}
