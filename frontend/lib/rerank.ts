// Re-rank incremental determinista, acotado a un solo recommendation_context_id.
// No toca el catálogo global ni otros contextos.
import type { CatalogMovie, RecommendationItem } from "./types";

const BOOST = 5;
const PENALTY = 5;
const BOOST_CAP = 10;

function sharesSignal(a: Pick<CatalogMovie, "mood_tags" | "genres">, b: Pick<CatalogMovie, "mood_tags" | "genres">) {
  const moodOverlap = (a.mood_tags || []).some((t) => (b.mood_tags || []).includes(t));
  const genreOverlap = (a.genres || []).some((g) => (b.genres || []).includes(g));
  return moodOverlap || genreOverlap;
}

function sharesAllSignals(target: Pick<CatalogMovie, "mood_tags" | "genres">, other: Pick<CatalogMovie, "mood_tags" | "genres">) {
  const targetMood = new Set(target.mood_tags || []);
  const targetGenres = new Set(target.genres || []);
  const moodSubset = (other.mood_tags || []).every((t) => targetMood.has(t)) && (other.mood_tags || []).length > 0;
  const genreSubset = (other.genres || []).every((g) => targetGenres.has(g)) && (other.genres || []).length > 0;
  return moodSubset && genreSubset;
}

export function applyIncrementalRerank(
  items: (RecommendationItem & { movie: Pick<CatalogMovie, "id" | "mood_tags" | "genres"> })[],
  targetMovieId: string,
  action: "like" | "dislike",
  boostState: Map<string, number> = new Map()
) {
  const target = items.find((i) => i.movie_id === targetMovieId);
  if (!target) return items;

  return items.map((item) => {
    if (item.movie_id === targetMovieId) {
      if (action === "dislike") return { ...item, score: -1 };
      return item;
    }

    if (action === "like" && sharesSignal(item.movie, target.movie)) {
      const already = boostState.get(item.movie_id) || 0;
      const applied = Math.min(BOOST, BOOST_CAP - already);
      if (applied <= 0) return item;
      boostState.set(item.movie_id, already + applied);
      return { ...item, score: Math.round((item.score + applied) * 100) / 100 };
    }

    if (action === "dislike" && sharesAllSignals(target.movie, item.movie)) {
      return { ...item, score: Math.round((item.score - PENALTY) * 100) / 100 };
    }

    return item;
  });
}
