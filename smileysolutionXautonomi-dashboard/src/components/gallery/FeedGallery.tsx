"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/Badge";
import { PERSONA_CONFIG, type ClientPersona } from "@/types/content";
import { t } from "@/lib/i18n/he";

export function FeedGallery() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data } = trpc.content.list.useQuery({
    status: "published",
    limit: 50,
  });

  const pieces = data?.items ?? [];

  if (pieces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-raised)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
          <span className="text-2xl">🖼</span>
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {t.gallery.emptyTitle}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          {t.gallery.emptyBody}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-[var(--border-subtle)]">
        <h1 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          {t.gallery.heading}
        </h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {t.gallery.subheading(pieces.length)}
        </p>
      </div>

      {/* 3-col grid */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-3 gap-1">
          {pieces.map((piece, idx) => {
            const typedPiece = piece as {
              id: string;
              title: string;
              feed_copy_en?: string | null;
              client_persona?: string | null;
              media_assets?: Array<{ url: string }> | null;
            };

            const thumbnail = typedPiece.media_assets?.[0]?.url;
            const hash = typedPiece.title
              .split("")
              .reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
            const hue = hash % 360;

            const personaConfig =
              typedPiece.client_persona && typedPiece.client_persona in PERSONA_CONFIG
                ? PERSONA_CONFIG[typedPiece.client_persona as ClientPersona]
                : null;

            const isHovered = hoveredId === typedPiece.id;

            return (
              <motion.div
                key={typedPiece.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (idx % 9) * 0.04 }}
                className="relative aspect-square overflow-hidden group"
                onMouseEnter={() => setHoveredId(typedPiece.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Image or gradient */}
                {thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnail}
                    alt={typedPiece.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(135deg, hsl(${hue}, 30%, 15%) 0%, hsl(${(hue + 60) % 360}, 25%, 10%) 100%)`,
                    }}
                  />
                )}

                {/* Hover overlay */}
                <motion.div
                  className="absolute inset-0 bg-black/75 flex flex-col justify-end p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <p className="text-xs text-white font-medium line-clamp-2 leading-snug mb-2">
                    {typedPiece.title}
                  </p>
                  {typedPiece.feed_copy_en && (
                    <p className="text-[10px] text-white/70 line-clamp-3 leading-relaxed mb-2">
                      {typedPiece.feed_copy_en.slice(0, 120)}…
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    {personaConfig && (
                      <Badge
                        label={personaConfig.label}
                        color={personaConfig.color}
                        size="xs"
                      />
                    )}
                    <Link
                      href={`/content/${typedPiece.id}`}
                      className="text-[10px] text-[var(--accent)] hover:underline"
                    >
                      {t.actions.edit}
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
