import type {
  ActionRhythmPreference,
  FallbackReasonCode,
  Genre,
  Mood,
  RatingCode,
  RomanceTolerance,
  Situation,
  Theme,
  UsageFrequency,
} from "./constants";

export interface CatalogMovie {
  id: string;
  title: string;
  poster_url: string | null;
  genres: Genre[];
  themes: Theme[];
  mood_tags: Mood[];
  duration_bucket: "Corta" | "Media" | "Larga" | null;
  rating_code: RatingCode;
  violence_level: 0 | 1 | 2;
  popularity_score: number;
  data_quality_flags: string[];
}

export interface UserProfile {
  user_id: string;
  profile_version: number;
  onboarding_completed: boolean;
  preferred_genres: Genre[];
  preferred_themes: Theme[];
  romance_tolerance: RomanceTolerance;
  action_rhythm_preference: ActionRhythmPreference;
  excluded_rating_codes: RatingCode[];
  max_violence_level: 0 | 1 | 2;
  situation_typical: Situation;
  usage_frequency: UsageFrequency;
}

export interface MatchSignals {
  mood_matched: boolean;
  matched_genres: string[];
  matched_themes: string[];
  alignment_axis: "romance_tolerance" | "action_rhythm" | null;
  alignment_result: "match" | "mixed" | "mismatch" | "n/a";
  popularity_tier: "alta" | "media" | "baja";
}

export interface RecommendationItem {
  movie_id: string;
  title: string;
  poster_url: string | null;
  score: number;
  match_signals: MatchSignals;
  explanation: string;
}

export interface RecommendationResult {
  items: RecommendationItem[];
  fallback_used: boolean;
  fallback_reason_code: FallbackReasonCode;
}

export interface RecommendationContextRecord extends RecommendationResult {
  id: string;
  user_id: string;
  scoring_version: string;
  input_hash: string;
  mood: Mood | null;
  situation: Situation;
  created_at: string;
}

export interface SessionHistory {
  last_recommendation_context_id: string | null;
  last_mood: Mood | null;
  last_situation: Situation | null;
  last_profile_version_saved: number;
  last_created_at: string | null;
}

export type FeedbackAction = "like" | "dislike";

export interface FeedbackEvent {
  movie_id: string;
  mood: Mood | null;
  situation: Situation;
  recommendation_context_id: string;
  action: FeedbackAction;
  created_at: string;
}

export type ChatTurnState = {
  turn: number;
  mood: Mood | null;
  situation: Situation | null;
} | null;

export type ChatTurnResult =
  | {
      type: "ask_mood" | "ask_situation";
      turn_state: ChatTurnState;
      message: string;
      quick_replies: { value: string; label: string }[];
    }
  | ({
      type: "recommendation";
      turn_state: ChatTurnState;
      mood: Mood | null;
      situation: Situation;
      recommendation_context_id: string;
    } & RecommendationResult);
