// Agente rule-based, determinista, ~3 turnos, sin memoria entre sesiones ni NLP/ML.
import { MOODS, MOOD_LABELS, SITUATIONS, type Mood, type Situation } from "./constants";
import { recommend } from "./engine";
import type { CatalogMovie, ChatTurnResult, ChatTurnState, UserProfile } from "./types";

const MOOD_KEYWORDS: Record<Mood, string[]> = {
  Romance_leve: ["romance", "romantica", "romantico", "amor", "tierna"],
  Romance_intenso: ["romance intenso", "pasion", "drama romantico"],
  Accion_pausa: ["accion tranquila", "aventura"],
  Accion_rapido: ["accion", "adrenalina", "explosiones", "rapida"],
  Comedia: ["comedia", "reirme", "divertida", "humor"],
  Drama: ["drama", "profunda", "emotiva"],
  Suspenso: ["suspenso", "thriller", "misterio", "tension"],
};

const SITUATION_KEYWORDS: Record<Situation, string[]> = {
  Solo: ["solo", "sola", "sole"],
  Con_amigos: ["amigos", "amigas", "grupo"],
  Con_familia: ["familia", "hijos", "padres", "chicos"],
};

function detect<T extends string>(message: string, dictionary: Record<T, string[]>): T | null {
  const normalized = (message || "").toLowerCase();
  for (const key of Object.keys(dictionary) as T[]) {
    if (dictionary[key].some((s) => normalized.includes(s))) return key;
  }
  return null;
}

export function quickReplyMoods() {
  return MOODS.slice(0, 3).map((m) => ({ value: m, label: MOOD_LABELS[m] }));
}

export function quickReplySituations() {
  return SITUATIONS.map((s) => ({ value: s, label: s.replace("_", " ") }));
}

export function handleTurn({
  message,
  turnState,
  catalog,
  profile,
}: {
  message: string;
  turnState: ChatTurnState;
  catalog: CatalogMovie[];
  profile: UserProfile | null;
}): ChatTurnResult {
  const state = turnState || { turn: 0, mood: null, situation: null };
  const nextTurn = state.turn + 1;

  const detectedMood = state.mood || detect<Mood>(message, MOOD_KEYWORDS);
  const detectedSituation = state.situation || detect<Situation>(message, SITUATION_KEYWORDS);

  const hasMood = Boolean(detectedMood);
  const hasSituation = Boolean(detectedSituation);
  const atTurnLimit = nextTurn >= 3;

  if (hasMood && hasSituation) {
    const result = recommend({ catalog, profile, mood: detectedMood, situation: detectedSituation as Situation, surface: "chat" });
    return {
      type: "recommendation",
      turn_state: { turn: nextTurn, mood: detectedMood, situation: detectedSituation },
      mood: detectedMood,
      situation: detectedSituation as Situation,
      recommendation_context_id: "",
      ...result,
    };
  }

  if (atTurnLimit) {
    const situation = (detectedSituation as Situation) || "Solo";
    const result = recommend({ catalog, profile, mood: detectedMood, situation, surface: "chat" });
    return {
      type: "recommendation",
      turn_state: { turn: nextTurn, mood: detectedMood, situation },
      mood: detectedMood,
      situation,
      recommendation_context_id: "",
      ...result,
    };
  }

  if (!hasMood) {
    return {
      type: "ask_mood",
      turn_state: { turn: nextTurn, mood: null, situation: detectedSituation },
      message: "¿Qué mood tenés hoy?",
      quick_replies: quickReplyMoods(),
    };
  }

  return {
    type: "ask_situation",
    turn_state: { turn: nextTurn, mood: detectedMood, situation: null },
    message: "¿Con quién la vas a ver?",
    quick_replies: quickReplySituations(),
  };
}
