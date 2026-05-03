"use client";

import { trpc } from "@/lib/trpc/client";
import { PERSONA_CONFIG, type ClientPersona } from "@/types/content";
import { Badge } from "@/components/ui/Badge";
import { t } from "@/lib/i18n/he";

export default function PersonasPage() {
  const { data: personas } = trpc.personas.list.useQuery();

  const personaKeys = Object.keys(PERSONA_CONFIG) as ClientPersona[];

  return (
    <div className="px-8 pt-8 pb-12">
      <div className="mb-8">
        <h1 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          {t.personas.heading}
        </h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {t.personas.subheading}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {personaKeys.map((key) => {
          const config = PERSONA_CONFIG[key];
          const dbPersona = personas?.find(
            (p: { key: string }) => p.key === key
          );

          return (
            <div key={key} className="card p-5 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: `${config.color}20`,
                    color: config.color,
                    border: `1px solid ${config.color}40`,
                  }}
                >
                  {config.label.charAt(0)}
                </div>
                <Badge label={config.label} color={config.color} />
              </div>

              {/* Tone profile */}
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
                  {t.personas.toneProfile}
                </p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {dbPersona?.tone_profile ?? t.personas.loading}
                </p>
              </div>

              {/* Pain point */}
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
                  {t.personas.corePain}
                </p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {dbPersona?.target_pain ?? "—"}
                </p>
              </div>

              {/* Example hook */}
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
                  {t.personas.exampleHook}
                </p>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed italic">
                  &ldquo;{dbPersona?.example_hook ?? "—"}&rdquo;
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
