"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import {
  PERSONA_CONFIG,
  VIRAL_SIGNAL_CONFIG,
  type ContentPiece,
} from "@/types/content";
import { showToast } from "@/components/ui/Toast";
import { t } from "@/lib/i18n/he";

interface InboxCardProps {
  piece: ContentPiece;
  isFocused: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onStar: (id: string) => Promise<void>;
  onClick: () => void;
}

export function InboxCard({
  piece,
  isFocused,
  onApprove,
  onReject,
  onStar,
  onClick,
}: InboxCardProps) {
  const [exiting, setExiting] = useState<"approve" | "reject" | null>(null);

  const personaConfig = piece.clientPersona
    ? PERSONA_CONFIG[piece.clientPersona]
    : null;

  const viralConfig = piece.viralSignals?.label
    ? VIRAL_SIGNAL_CONFIG[piece.viralSignals.label]
    : null;

  const handleAction = useCallback(
    async (
      action: "approve" | "reject" | "star",
      fn: (id: string) => Promise<void>
    ) => {
      if (action !== "star") setExiting(action);

      try {
        await fn(piece.id);
        if (action === "star") {
          showToast(t.inboxCard.toastStarred);
        }
      } catch {
        setExiting(null);
        showToast(t.inboxCard.toastFailed, "error");
      }
    },
    [piece.id]
  );

  const thumbnail = (piece.mediaAssets as Array<{ url: string }> | null)?.[0]?.url;
  const timeAgo = formatTimeAgo(piece.createdAt);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          layout
          layoutId={piece.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={
            exiting === "approve"
              ? { opacity: 0, x: 60, scale: 0.95 }
              : { opacity: 0, x: -60, scale: 0.95 }
          }
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={onClick}
          className={`
            card cursor-pointer group relative
            transition-all duration-150
            ${isFocused
              ? "border-[var(--border-strong)] ring-1 ring-[var(--accent)] ring-opacity-30"
              : "hover:border-[var(--border-default)]"
            }
          `}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") onClick();
          }}
        >
          {/* Thumbnail */}
          <div className="relative h-36 bg-[var(--bg-overlay)] rounded-t-md overflow-hidden">
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnail}
                alt={piece.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <GradientPlaceholder title={piece.title} />
            )}

            {/* Star button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleAction("star", onStar);
              }}
              className={`
                absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center
                transition-all duration-150
                ${piece.status === "starred"
                  ? "bg-amber-400/20 text-amber-400"
                  : "bg-black/40 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-amber-400"
                }
              `}
              title="Star (S)"
            >
              <StarIcon filled={piece.status === "starred"} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            {/* Title + meta */}
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 leading-snug">
                {piece.title}
              </h3>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                {piece.sourceUrl
                  ? new URL(piece.sourceUrl).hostname.replace("www.", "")
                  : piece.source}{" "}
                · {timeAgo}
              </p>
            </div>

            {/* Viral Signal */}
            {viralConfig && piece.viralSignals && (
              <div className="rounded-md bg-[var(--bg-overlay)] border border-[var(--border-subtle)] px-3 py-2 space-y-1">
                <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">
                  {t.inboxCard.whyViral}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{viralConfig.emoji}</span>
                  <span className="text-xs text-[var(--text-primary)]">
                    {viralConfig.label}
                  </span>
                </div>
                {piece.viralSignals.engagementCount > 0 && (
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    {t.inboxCard.engagements(piece.viralSignals.engagementCount)}
                  </p>
                )}
                {piece.viralSignals.trendTags.length > 0 && (
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                    {piece.viralSignals.trendTags
                      .slice(0, 3)
                      .map((t) => `#${t}`)
                      .join(" ")}
                  </p>
                )}
              </div>
            )}

            {/* Persona match */}
            {personaConfig && piece.viralSignals && (
              <div className="flex items-center justify-between">
                <Badge label={personaConfig.label} color={personaConfig.color} size="xs" />
                <span className="text-[10px] text-[var(--text-secondary)]">
                  {t.inboxCard.match(piece.viralSignals.confidenceScore)}
                </span>
              </div>
            )}

            {/* Copy preview */}
            {piece.feedCopyEn && (
              <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                {piece.feedCopyEn.slice(0, 100)}
                {piece.feedCopyEn.length > 100 ? "…" : ""}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => void handleAction("reject", onReject)}
                className="flex-1 py-2 rounded-md text-xs font-medium text-red-400 bg-red-400/8 border border-red-400/20 hover:bg-red-400/15 transition-colors"
                title={t.inboxCard.reject}
              >
                ✗ {t.inboxCard.reject}
              </button>
              <button
                onClick={() => void handleAction("approve", onApprove)}
                className="flex-1 py-2 rounded-md text-xs font-semibold text-black bg-[var(--accent)] hover:opacity-90 transition-opacity"
                title={t.inboxCard.approve}
              >
                ✓ {t.inboxCard.approve}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function GradientPlaceholder({ title }: { title: string }) {
  const hash = title
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  const hue2 = (hue + 60) % 360;

  return (
    <div
      className="w-full h-full flex items-end p-3"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 30%, 12%) 0%, hsl(${hue2}, 25%, 8%) 100%)`,
      }}
    >
      <div
        className="w-8 h-0.5 rounded"
        style={{ background: `hsl(${hue}, 60%, 60%)` }}
      />
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill={filled ? "currentColor" : "none"}>
      <path
        d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.1L6 8l-2.78 1.56.53-3.1L1.5 4.27l3.11-.45L6 1z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
