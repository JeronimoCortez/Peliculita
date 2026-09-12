"use client";

import { MOODS, MOOD_LABELS, type Mood } from "@/lib/constants";

export default function MoodSelector({ value, onChange }: { value: Mood | null; onChange: (mood: Mood | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`rounded-full border px-3 py-1.5 text-sm ${value === null ? "border-peli-accent bg-peli-accent/20 text-white" : "border-white/15 text-gray-300 hover:border-white/40"}`}
      >
        General
      </button>
      {MOODS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`rounded-full border px-3 py-1.5 text-sm ${value === m ? "border-peli-accent bg-peli-accent/20 text-white" : "border-white/15 text-gray-300 hover:border-white/40"}`}
        >
          {MOOD_LABELS[m]}
        </button>
      ))}
    </div>
  );
}
