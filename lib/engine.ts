// Motor de recomendación determinista, sin ML. Corre en el cliente (ver README).
// Escalera de fallback y fórmula documentadas en línea; misma lógica que el diseño
// original del backend, portada 1:1 a TypeScript.

import { FALLBACK_REASON_CODES, MIN_CANDIDATES, WEIGHTS, type Mood, type RatingCode, type Situation } from "./constants";
import { buildExplanation } from "./explain";
import type { CatalogMovie, MatchSignals, RecommendationItem, RecommendationResult, UserProfile } from "./types";

function isProfileIncomplete(profile: UserProfile | null): boolean {
  if (!profile || !profile.onboarding_completed) return true;
  const noGenres = !profile.preferred_genres || profile.preferred_genres.length === 0;
  const noThemes = !profile.preferred_themes || profile.preferred_themes.length === 0;
  return noGenres && noThemes;
}

function effectiveSafetyFilters(profile: UserProfile, situation: Situation) {
  let maxViolence = profile.max_violence_level;
  let excludedRatingCodes: RatingCode[] = Array.isArray(profile.excluded_rating_codes)
    ? [...profile.excluded_rating_codes]
    : [];

  if (situation === "Con_familia") {
    maxViolence = Math.min(maxViolence, 1) as 0 | 1;
    if (!excludedRatingCodes.includes("Mas_18")) excludedRatingCodes.push("Mas_18");
  }

  return { maxViolence, excludedRatingCodes };
}

function passesSafetyFilters(movie: CatalogMovie, safety: { maxViolence: number; excludedRatingCodes: RatingCode[] }) {
  if (safety.excludedRatingCodes.includes(movie.rating_code)) return false;
  if (movie.violence_level > safety.maxViolence) return false;
  return true;
}

function overlap<T>(a: T[] = [], b: T[] = []): T[] {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

function genreThemeMatch(movie: CatalogMovie, profile: UserProfile) {
  const matchedGenres = overlap(movie.genres || [], profile.preferred_genres || []);
  const matchedThemes = overlap(movie.themes || [], profile.preferred_themes || []);
  const genreScore =
    (profile.preferred_genres || []).length > 0
      ? matchedGenres.length / Math.max(1, profile.preferred_genres.length)
      : 0;
  const themeScore =
    (profile.preferred_themes || []).length > 0
      ? matchedThemes.length / Math.max(1, profile.preferred_themes.length)
      : 0;
  return { value: 0.6 * genreScore + 0.4 * themeScore, matchedGenres, matchedThemes };
}

function restrictionCompat(mood: Mood | null, profile: UserProfile): { value: number; axis: MatchSignals["alignment_axis"]; result: MatchSignals["alignment_result"] } {
  if (mood === "Romance_leve" || mood === "Romance_intenso") {
    const wants = mood === "Romance_leve" ? "leve" : "intenso";
    const tol = profile.romance_tolerance;
    if (tol === "mixto") return { value: 0.7, axis: "romance_tolerance", result: "mixed" };
    if (tol === wants) return { value: 1.0, axis: "romance_tolerance", result: "match" };
    return { value: 0.3, axis: "romance_tolerance", result: "mismatch" };
  }
  if (mood === "Accion_pausa" || mood === "Accion_rapido") {
    const wants = mood === "Accion_pausa" ? "pausa" : "rapido";
    const pref = profile.action_rhythm_preference;
    if (pref === "mixto") return { value: 0.7, axis: "action_rhythm", result: "mixed" };
    if (pref === wants) return { value: 1.0, axis: "action_rhythm", result: "match" };
    return { value: 0.3, axis: "action_rhythm", result: "mismatch" };
  }
  return { value: 1.0, axis: null, result: "n/a" };
}

function popularityTier(score: number): MatchSignals["popularity_tier"] {
  if (score >= 70) return "alta";
  if (score >= 40) return "media";
  return "baja";
}

interface ScoredMovie {
  movie: CatalogMovie;
  score: number;
  matchSignals: MatchSignals;
}

function scoreMovie(movie: CatalogMovie, profile: UserProfile, mood: Mood | null): ScoredMovie {
  const moodMatched = mood ? (movie.mood_tags || []).includes(mood) : false;
  const moodMatch = moodMatched ? 1 : 0;
  const gt = genreThemeMatch(movie, profile);
  const restriction = mood ? restrictionCompat(mood, profile) : { value: 1.0, axis: null, result: "n/a" as const };
  const popularity = Number(movie.popularity_score) || 0;

  const rawScore =
    WEIGHTS.MOOD * moodMatch + WEIGHTS.GENRE_THEME * gt.value + WEIGHTS.RESTRICTION * restriction.value + WEIGHTS.POPULARITY * (popularity / 100);
  const score = Math.round(rawScore * 100) / 100;

  const matchSignals: MatchSignals = {
    mood_matched: moodMatched,
    matched_genres: gt.matchedGenres,
    matched_themes: gt.matchedThemes,
    alignment_axis: restriction.axis,
    alignment_result: restriction.result,
    popularity_tier: popularityTier(popularity),
  };

  return { movie, score, matchSignals };
}

export function deterministicSort(a: ScoredMovie, b: ScoredMovie): number {
  if (b.score !== a.score) return b.score - a.score;
  const popA = Number(a.movie.popularity_score) || 0;
  const popB = Number(b.movie.popularity_score) || 0;
  if (popB !== popA) return popB - popA;
  return a.movie.title.localeCompare(b.movie.title);
}

function finalize(results: ScoredMovie[], fallbackUsed: boolean, fallbackReasonCode: RecommendationResult["fallback_reason_code"], mood: Mood | null): RecommendationResult {
  const items: RecommendationItem[] = results.map((r) => ({
    movie_id: r.movie.id,
    title: r.movie.title,
    poster_url: r.movie.poster_url,
    score: r.score,
    match_signals: r.matchSignals,
    explanation: buildExplanation(r.matchSignals, fallbackUsed, mood),
  }));
  return { items, fallback_used: fallbackUsed, fallback_reason_code: fallbackReasonCode };
}

function rankPopular(catalog: CatalogMovie[], safety: ReturnType<typeof effectiveSafetyFilters>, mood: Mood | null, topN: number): ScoredMovie[] {
  const neutralProfile = { preferred_genres: [], preferred_themes: [] } as unknown as UserProfile;
  return catalog
    .filter((m) => passesSafetyFilters(m, safety))
    .map((m) => scoreMovie(m, neutralProfile, mood))
    .sort(deterministicSort)
    .slice(0, topN);
}

export function recommend({
  catalog,
  profile,
  mood,
  situation,
  surface,
}: {
  catalog: CatalogMovie[];
  profile: UserProfile | null;
  mood: Mood | null;
  situation: Situation;
  surface: "feed" | "chat";
}): RecommendationResult {
  const thresholds = MIN_CANDIDATES[surface];
  const topN = surface === "feed" ? 20 : 3;

  if (isProfileIncomplete(profile)) {
    const safety = effectiveSafetyFilters(profile ?? ({ max_violence_level: 2, excluded_rating_codes: [] } as unknown as UserProfile), situation);
    const results = rankPopular(catalog, safety, mood, topN);
    return finalize(results, true, FALLBACK_REASON_CODES.PROFILE_INCOMPLETE, mood);
  }

  const p = profile as UserProfile;
  const safety = effectiveSafetyFilters(p, situation);

  // Escalón 1: estricto (mood + genero/tema + seguridad)
  const strict = catalog
    .filter((m) => passesSafetyFilters(m, safety))
    .filter((m) => (mood ? (m.mood_tags || []).includes(mood) : true))
    .map((m) => scoreMovie(m, p, mood))
    .filter((r) => !mood || r.matchSignals.matched_genres.length || r.matchSignals.matched_themes.length);

  if (strict.length >= thresholds.strict) {
    return finalize(strict.sort(deterministicSort).slice(0, topN), false, FALLBACK_REASON_CODES.NONE, mood);
  }

  // Escalón 2: relaja genero/tema, mantiene mood + seguridad
  if (mood) {
    const relaxedMood = catalog
      .filter((m) => passesSafetyFilters(m, safety))
      .filter((m) => (m.mood_tags || []).includes(mood))
      .map((m) => scoreMovie(m, p, mood));

    if (relaxedMood.length >= thresholds.relaxed_mood) {
      return finalize(relaxedMood.sort(deterministicSort).slice(0, topN), true, FALLBACK_REASON_CODES.LOW_COVERAGE_RELAXED_GENRE, mood);
    }
  }

  // Escalón 3: relaja mood, exige genero/tema + seguridad
  const relaxedGenre = catalog
    .filter((m) => passesSafetyFilters(m, safety))
    .map((m) => scoreMovie(m, p, mood))
    .filter((r) => r.matchSignals.matched_genres.length || r.matchSignals.matched_themes.length);

  if (relaxedGenre.length >= thresholds.relaxed_genre) {
    return finalize(relaxedGenre.sort(deterministicSort).slice(0, topN), true, FALLBACK_REASON_CODES.LOW_COVERAGE_RELAXED_MOOD, mood);
  }

  // Escalón 4: populares dentro de filtros de seguridad
  const popular = catalog.filter((m) => passesSafetyFilters(m, safety)).map((m) => scoreMovie(m, p, mood));

  if (popular.length >= thresholds.popular) {
    return finalize(popular.sort(deterministicSort).slice(0, topN), true, FALLBACK_REASON_CODES.LOW_COVERAGE_POPULAR, mood);
  }

  // Escalón 5: crítico, relaja también filtros de seguridad (última red)
  const critical = catalog.map((m) => scoreMovie(m, p, mood));
  return finalize(critical.sort(deterministicSort).slice(0, topN), true, FALLBACK_REASON_CODES.LOW_COVERAGE_CRITICAL, mood);
}
