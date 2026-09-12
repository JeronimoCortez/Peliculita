"use client";

import { SITUATIONS, SITUATION_LABELS, type Situation } from "@/lib/constants";

export default function SituationSelector({ value, onChange }: { value: Situation; onChange: (situation: Situation) => void }) {
  return (
    <div className="flex gap-2">
      {SITUATIONS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`rounded-md border px-3 py-1.5 text-sm ${value === s ? "border-peli-accent bg-peli-accent/20 text-white" : "border-white/15 text-gray-300 hover:border-white/40"}`}
        >
          {SITUATION_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
