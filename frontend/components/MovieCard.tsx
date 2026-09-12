"use client";

import { useState } from "react";
import type { RecommendationItem } from "@/lib/types";

export default function MovieCard({
  item,
  onFeedback,
}: {
  item: RecommendationItem;
  onFeedback: (movieId: string, action: "like" | "dislike") => void;
}) {
  const [chosen, setChosen] = useState<"like" | "dislike" | null>(null);

  function handle(action: "like" | "dislike") {
    setChosen(action);
    onFeedback(item.movie_id, action);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-peli-card">
      <div className="flex aspect-[2/3] items-center justify-center bg-white/5 text-3xl">🎬</div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold">{item.title}</h3>
        <p className="line-clamp-2 text-xs text-gray-400">{item.explanation}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-[11px] text-gray-500">score {item.score}</span>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Me gusta"
              onClick={() => handle("like")}
              className={`rounded-md px-2 py-1 text-sm ${chosen === "like" ? "bg-green-600/30 text-green-400" : "text-gray-400 hover:text-green-400"}`}
            >
              👍
            </button>
            <button
              type="button"
              aria-label="No me gusta"
              onClick={() => handle("dislike")}
              className={`rounded-md px-2 py-1 text-sm ${chosen === "dislike" ? "bg-red-600/30 text-red-400" : "text-gray-400 hover:text-red-400"}`}
            >
              👎
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
