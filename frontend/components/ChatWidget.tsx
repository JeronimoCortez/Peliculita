"use client";

import { useState } from "react";
import MovieCard from "./MovieCard";
import { requestChat, sendFeedback } from "@/lib/api";
import type { ChatTurnResult, ChatTurnState } from "@/lib/types";
import type { Mood, Situation } from "@/lib/constants";

type ChatMessage =
  | { from: "user"; text: string }
  | { from: "agent"; text: string; quickReplies?: { value: string; label: string }[] }
  | { from: "agent-result"; result: Extract<ChatTurnResult, { type: "recommendation" }> };

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "agent", text: "Hola, contame qué tenés ganas de ver hoy." },
  ]);
  const [turnState, setTurnState] = useState<ChatTurnState>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");

    const result = await requestChat({ message: text, turnState });
    setTurnState(result.turn_state);

    if (result.type === "recommendation") {
      setMessages((prev) => [...prev, { from: "agent-result", result }]);
    } else {
      setMessages((prev) => [...prev, { from: "agent", text: result.message, quickReplies: result.quick_replies }]);
    }
    setBusy(false);
  }

  async function handleFeedback(contextId: string, mood: Mood | null, situation: Situation, movieId: string, action: "like" | "dislike") {
    const { updated_items: updatedItems } = await sendFeedback({
      movieId,
      mood,
      situation,
      recommendationContextId: contextId,
      action,
    });
    if (!updatedItems) return;
    setMessages((prev) =>
      prev.map((m) => (m.from === "agent-result" && m.result.recommendation_context_id === contextId ? { ...m, result: { ...m.result, items: updatedItems } } : m))
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col px-4 py-4">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((m, i) => {
          if (m.from === "user") {
            return (
              <div key={i} className="flex justify-end">
                <p className="max-w-[80%] rounded-lg bg-peli-accent px-3 py-2 text-sm text-white">{m.text}</p>
              </div>
            );
          }
          if (m.from === "agent") {
            return (
              <div key={i} className="flex flex-col items-start gap-2">
                <p className="max-w-[80%] rounded-lg bg-peli-card px-3 py-2 text-sm text-gray-100">{m.text}</p>
                {m.quickReplies && (
                  <div className="flex flex-wrap gap-2">
                    {m.quickReplies.map((qr) => (
                      <button
                        key={qr.value}
                        type="button"
                        onClick={() => submit(qr.label)}
                        className="rounded-full border border-white/15 px-3 py-1 text-xs text-gray-300 hover:border-white/40"
                      >
                        {qr.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <div key={i} className="space-y-2">
              <p className="max-w-[80%] rounded-lg bg-peli-card px-3 py-2 text-sm text-gray-100">
                Encontré {m.result.items.length} opción(es) para vos:
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {m.result.items.map((item) => (
                  <MovieCard
                    key={item.movie_id}
                    item={item}
                    onFeedback={(movieId, action) => handleFeedback(m.result.recommendation_context_id, m.result.mood, m.result.situation, movieId, action)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí algo como “quiero una comedia con amigos”"
          className="flex-1 rounded-md border border-white/15 bg-peli-card px-3 py-2 text-sm outline-none focus:border-peli-accent"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-peli-accent px-4 py-2 text-sm font-medium hover:bg-peli-accentHover disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
