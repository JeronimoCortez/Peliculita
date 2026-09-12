"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ACTION_RHYTHM_PREFERENCE,
  GENRES,
  RATING_CODES,
  ROMANCE_TOLERANCE,
  SITUATIONS,
  SITUATION_LABELS,
  THEMES,
  USAGE_FREQUENCY,
  type ActionRhythmPreference,
  type Genre,
  type RatingCode,
  type RomanceTolerance,
  type Situation,
  type Theme,
  type UsageFrequency,
} from "@/lib/constants";
import { saveOnboarding } from "@/lib/api";

const STEPS = ["Gustos", "Restricciones", "Contexto", "Confirmar"] as const;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [preferredGenres, setPreferredGenres] = useState<Genre[]>([]);
  const [preferredThemes, setPreferredThemes] = useState<Theme[]>([]);
  const [romanceTolerance, setRomanceTolerance] = useState<RomanceTolerance>("mixto");
  const [actionRhythm, setActionRhythm] = useState<ActionRhythmPreference>("mixto");
  const [excludedRatingCodes, setExcludedRatingCodes] = useState<RatingCode[]>([]);
  const [maxViolenceLevel, setMaxViolenceLevel] = useState<0 | 1 | 2>(2);
  const [situationTypical, setSituationTypical] = useState<Situation>("Solo");
  const [usageFrequency, setUsageFrequency] = useState<UsageFrequency>("semanal");

  async function handleSubmit() {
    setSubmitting(true);
    await saveOnboarding({
      preferred_genres: preferredGenres,
      preferred_themes: preferredThemes,
      romance_tolerance: romanceTolerance,
      action_rhythm_preference: actionRhythm,
      excluded_rating_codes: excludedRatingCodes,
      max_violence_level: maxViolenceLevel,
      situation_typical: situationTypical,
      usage_frequency: usageFrequency,
    });
    setSubmitting(false);
    router.push("/feed");
  }

  const canAdvance = step === 0 ? preferredGenres.length > 0 || preferredThemes.length > 0 : true;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">Contanos qué te gusta</h1>
      <p className="mt-1 text-sm text-gray-400">Esto nos permite armar tu feed "Para ti" sin usar IA generativa: es un motor de reglas 100% transparente.</p>

      <ol className="mt-6 flex gap-2 text-xs text-gray-400">
        {STEPS.map((label, i) => (
          <li key={label} className={`rounded-full px-3 py-1 ${i === step ? "bg-peli-accent text-white" : "bg-white/5"}`}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-6">
        {step === 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="mb-2 font-semibold">Géneros que te gustan</h2>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setPreferredGenres((prev) => toggle(prev, g))}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      preferredGenres.includes(g) ? "border-peli-accent bg-peli-accent/20 text-white" : "border-white/15 text-gray-300 hover:border-white/40"
                    }`}
                  >
                    {g.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 font-semibold">Temas que te interesan</h2>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPreferredThemes((prev) => toggle(prev, t))}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      preferredThemes.includes(t) ? "border-peli-accent bg-peli-accent/20 text-white" : "border-white/15 text-gray-300 hover:border-white/40"
                    }`}
                  >
                    {t.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-6">
            <div>
              <h2 className="mb-2 font-semibold">Tolerancia al romance</h2>
              <div className="flex gap-2">
                {ROMANCE_TOLERANCE.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRomanceTolerance(v)}
                    className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
                      romanceTolerance === v ? "border-peli-accent bg-peli-accent/20" : "border-white/15 text-gray-300"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 font-semibold">Ritmo de acción preferido</h2>
              <div className="flex gap-2">
                {ACTION_RHYTHM_PREFERENCE.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setActionRhythm(v)}
                    className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
                      actionRhythm === v ? "border-peli-accent bg-peli-accent/20" : "border-white/15 text-gray-300"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 font-semibold">Clasificaciones que preferís evitar</h2>
              <div className="flex gap-2">
                {RATING_CODES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setExcludedRatingCodes((prev) => toggle(prev, code))}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      excludedRatingCodes.includes(code) ? "border-peli-accent bg-peli-accent/20" : "border-white/15 text-gray-300"
                    }`}
                  >
                    {code.replace("_", "+")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 font-semibold">Nivel máximo de violencia que tolerás</h2>
              <div className="flex gap-2">
                {[0, 1, 2].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setMaxViolenceLevel(lvl as 0 | 1 | 2)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      maxViolenceLevel === lvl ? "border-peli-accent bg-peli-accent/20" : "border-white/15 text-gray-300"
                    }`}
                  >
                    {["Ninguna/leve", "Moderada", "Intensa"][lvl]}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            <div>
              <h2 className="mb-2 font-semibold">¿Con quién sueles ver contenido?</h2>
              <div className="flex gap-2">
                {SITUATIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSituationTypical(s)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      situationTypical === s ? "border-peli-accent bg-peli-accent/20" : "border-white/15 text-gray-300"
                    }`}
                  >
                    {SITUATION_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 font-semibold">¿Con qué frecuencia usás Peliculita?</h2>
              <div className="flex gap-2">
                {USAGE_FREQUENCY.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setUsageFrequency(f)}
                    className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
                      usageFrequency === f ? "border-peli-accent bg-peli-accent/20" : "border-white/15 text-gray-300"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="rounded-lg border border-white/10 bg-peli-card p-4 text-sm">
            <h2 className="mb-3 font-semibold">Revisá tu perfil</h2>
            <ul className="space-y-1 text-gray-300">
              <li><strong>Géneros:</strong> {preferredGenres.join(", ") || "—"}</li>
              <li><strong>Temas:</strong> {preferredThemes.join(", ") || "—"}</li>
              <li><strong>Tolerancia romance:</strong> {romanceTolerance}</li>
              <li><strong>Ritmo de acción:</strong> {actionRhythm}</li>
              <li><strong>Evita clasificaciones:</strong> {excludedRatingCodes.join(", ") || "ninguna"}</li>
              <li><strong>Violencia máxima:</strong> {["Ninguna/leve", "Moderada", "Intensa"][maxViolenceLevel]}</li>
              <li><strong>Situación típica:</strong> {SITUATION_LABELS[situationTypical]}</li>
              <li><strong>Frecuencia de uso:</strong> {usageFrequency}</li>
            </ul>
          </section>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="rounded-md px-4 py-2 text-sm text-gray-400 disabled:opacity-30"
        >
          Atrás
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="rounded-md bg-peli-accent px-4 py-2 text-sm font-medium hover:bg-peli-accentHover disabled:opacity-40"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="rounded-md bg-peli-accent px-4 py-2 text-sm font-medium hover:bg-peli-accentHover disabled:opacity-40"
          >
            {submitting ? "Guardando…" : "Empezar a usar Peliculita"}
          </button>
        )}
      </div>
    </div>
  );
}
