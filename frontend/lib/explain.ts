import { MOOD_LABELS, type Mood } from "./constants";
import type { MatchSignals } from "./types";

// Explicación corta, 100% derivada de match_signals. Nunca inventa una señal.
export function buildExplanation(matchSignals: MatchSignals, fallbackUsed: boolean, mood: Mood | null): string {
  const moodLabel = mood ? MOOD_LABELS[mood] : null;

  if (matchSignals.mood_matched && matchSignals.matched_genres.length && moodLabel) {
    return `Porque te gusta ${matchSignals.matched_genres[0]} y encaja con tu mood de ${moodLabel.toLowerCase()}.`;
  }
  if (matchSignals.mood_matched && matchSignals.matched_themes.length && moodLabel) {
    return `Porque te interesa ${matchSignals.matched_themes[0]} y encaja con tu mood de ${moodLabel.toLowerCase()}.`;
  }
  if (matchSignals.mood_matched && moodLabel) {
    return `Porque encaja con tu mood de ${moodLabel.toLowerCase()}.`;
  }
  if (fallbackUsed && moodLabel) {
    return `Una opción popular para tu mood de ${moodLabel.toLowerCase()}.`;
  }
  return "Una de las más elegidas en Peliculita.";
}
