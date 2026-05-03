"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { showToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import {
  PERSONA_CONFIG,
  STATUS_CONFIG,
  type ContentPiece,
  type ClientPersona,
  type ContentStatus,
} from "@/types/content";
import { t } from "@/lib/i18n/he";

interface ContentEditorProps {
  id: string;
}

type PreviewMode = "feed" | "stories";

export function ContentEditor({ id }: ContentEditorProps) {
  const { data: rawPiece, refetch } = trpc.content.get.useQuery({ id });
  const updateMutation = trpc.content.updateCopy.useMutation({
    onSuccess: () => {
      showToast(t.editor.toastSaved);
      void refetch();
    },
    onError: () => showToast(t.editor.toastSaveFailed, "error"),
  });
  const transitionMutation = trpc.content.transition.useMutation({
    onSuccess: () => {
      showToast(t.editor.toastStatusUpdated);
      void refetch();
    },
  });

  const [feedCopyEn, setFeedCopyEn] = useState("");
  const [storiesScriptHe, setStoriesScriptHe] = useState("");
  const [visualDirection, setVisualDirection] = useState("");
  const [preview, setPreview] = useState<PreviewMode>("feed");

  const piece = rawPiece as unknown as ContentPiece & {
    feed_copy_en?: string | null;
    stories_script_he?: string | null;
    visual_direction?: string | null;
    client_persona?: string | null;
    source_url?: string | null;
    raw_excerpt?: string | null;
    created_at?: string;
    updated_at?: string;
  } | undefined;

  useEffect(() => {
    if (!piece) return;
    setFeedCopyEn(piece.feed_copy_en ?? piece.feedCopyEn ?? "");
    setStoriesScriptHe(piece.stories_script_he ?? piece.storiesScriptHe ?? "");
    setVisualDirection(piece.visual_direction ?? piece.visualDirection ?? "");
  }, [piece]);

  if (!piece) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const resolvedPersona = piece.client_persona ?? piece.clientPersona;
  const personaConfig =
    resolvedPersona && resolvedPersona in PERSONA_CONFIG
      ? PERSONA_CONFIG[resolvedPersona as ClientPersona]
      : null;

  const statusConfig = STATUS_CONFIG[(piece.status ?? "draft") as ContentStatus];

  function handleSave() {
    updateMutation.mutate({
      id,
      feedCopyEn,
      storiesScriptHe,
      visualDirection,
    });
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-7 pb-5 border-b border-[var(--border-subtle)] flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg font-semibold text-[var(--text-primary)] line-clamp-1">
            {piece.title}
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            {personaConfig && (
              <Badge label={personaConfig.label} color={personaConfig.color} size="xs" />
            )}
            <span
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: statusConfig?.color }}
            >
              {statusConfig?.label}
            </span>
            {(piece.source_url ?? piece.sourceUrl) && (
              <a
                href={(piece.source_url ?? piece.sourceUrl)!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors truncate max-w-[200px]"
              >
                {t.editor.sourceLink}
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status transitions */}
          <StatusTransitionMenu
            currentStatus={(piece.status ?? "draft") as ContentStatus}
            onTransition={(status) =>
              transitionMutation.mutate({ id, status })
            }
          />

          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-[var(--accent)] text-black text-xs font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {updateMutation.isPending ? t.editor.saving : t.editor.save}
          </button>
        </div>
      </div>

      {/* Three-pane layout */}
      <div className="flex-1 overflow-hidden flex divide-x divide-[var(--border-subtle)]">
        {/* Left: Source reference */}
        <div className="w-64 shrink-0 overflow-y-auto p-5 space-y-4">
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-2">
              Source
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-[20]">
              {piece.raw_excerpt ?? piece.rawExcerpt ?? "No source excerpt"}
            </p>
          </div>

          {piece.visual_direction ?? piece.visualDirection ? (
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-2">
                Visual Direction
              </p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                {piece.visual_direction ?? piece.visualDirection}
              </p>
            </div>
          ) : null}
        </div>

        {/* Center: Editors */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* EN Feed Copy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest font-medium">
                {t.editor.feedCaptionLabel}
              </label>
              <span
                className={`text-[10px] font-mono ${
                  feedCopyEn.length > 2200
                    ? "text-red-400"
                    : "text-[var(--text-tertiary)]"
                }`}
              >
                {feedCopyEn.length} / 2200
              </span>
            </div>
            <textarea
              value={feedCopyEn}
              onChange={(e) => setFeedCopyEn(e.target.value)}
              rows={10}
              className="w-full bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-md px-4 py-3 text-sm text-[var(--text-primary)] resize-none outline-none focus:border-[var(--accent)] transition-colors leading-relaxed"
              placeholder={t.editor.feedPlaceholder}
            />
          </div>

          {/* HE Stories Script */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest font-medium">
                {t.editor.storiesLabel}
              </label>
            </div>
            <textarea
              value={storiesScriptHe}
              onChange={(e) => setStoriesScriptHe(e.target.value)}
              rows={8}
              dir="rtl"
              lang="he"
              className="w-full bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-md px-4 py-3 text-sm text-[var(--text-primary)] resize-none outline-none focus:border-[var(--accent)] transition-colors leading-relaxed font-[var(--font-heebo,sans-serif)]"
              placeholder="תסריט סטוריז בעברית…"
            />
          </div>

          {/* Visual direction editable */}
          <div>
            <label className="block text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest font-medium mb-2">
              {t.editor.visualLabel}
            </label>
            <input
              value={visualDirection}
              onChange={(e) => setVisualDirection(e.target.value)}
              className="w-full bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-md px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
              placeholder={t.editor.visualPlaceholder}
            />
          </div>
        </div>

        {/* Right: Preview */}
        <div className="w-72 shrink-0 overflow-y-auto p-5">
          <div className="flex gap-1 mb-4">
            {(["feed", "stories"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPreview(mode)}
                className={`flex-1 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-widest transition-colors ${
                  preview === mode
                    ? "bg-[var(--bg-overlay)] text-[var(--text-primary)] border border-[var(--border-default)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {mode === "feed" ? t.editor.tabFeed : t.editor.tabStories}
              </button>
            ))}
          </div>

          <motion.div
            key={preview}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {preview === "feed" ? (
              <FeedPreview caption={feedCopyEn} title={piece.title} />
            ) : (
              <StoriesPreview script={storiesScriptHe} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Feed Preview ─────────────────────────────────────────────────────────────

function FeedPreview({ caption, title }: { caption: string; title: string }) {
  const hash = title
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hash % 360;

  return (
    <div className="rounded-lg overflow-hidden border border-[var(--border-subtle)]">
      {/* Fake image */}
      <div
        className="h-56 w-full"
        style={{
          background: `linear-gradient(135deg, hsl(${hue}, 30%, 12%), hsl(${(hue + 60) % 360}, 25%, 8%))`,
        }}
      />
      {/* Caption */}
      <div className="p-3 bg-[var(--bg-surface)]">
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap line-clamp-6">
          {caption || (
            <span className="text-[var(--text-tertiary)] italic">
              {t.editor.captionPlaceholder}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Stories Preview ──────────────────────────────────────────────────────────

function StoriesPreview({ script }: { script: string }) {
  const slides = script
    ? script.split("|").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-2">
      {slides.length === 0 ? (
        <div className="h-40 rounded-lg border border-dashed border-[var(--border-subtle)] flex items-center justify-center">
          <p className="text-[10px] text-[var(--text-tertiary)] italic text-center" dir="rtl">
            תסריט סטוריז יופיע כאן…
          </p>
        </div>
      ) : (
        slides.map((slide, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-3"
          >
            <p className="text-[9px] text-[var(--accent)] mb-1 font-mono">
              {i + 1} / {slides.length}
            </p>
            <p
              className="text-xs text-[var(--text-primary)] leading-relaxed"
              dir="rtl"
              lang="he"
            >
              {slide}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Status Transition Menu ───────────────────────────────────────────────────

const NEXT_STATUSES: Partial<Record<ContentStatus, ContentStatus[]>> = {
  draft: ["approved", "archived"],
  approved: ["produced", "draft", "archived"],
  produced: ["published", "approved"],
  published: ["archived"],
};

function StatusTransitionMenu({
  currentStatus,
  onTransition,
}: {
  currentStatus: ContentStatus;
  onTransition: (s: ContentStatus) => void;
}) {
  const options = NEXT_STATUSES[currentStatus] ?? [];
  if (options.length === 0) return null;

  return (
    <select
      onChange={(e) => {
        if (e.target.value) onTransition(e.target.value as ContentStatus);
      }}
      defaultValue=""
      className="bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-md px-3 py-2 text-xs text-[var(--text-secondary)] outline-none"
    >
      <option value="" disabled>
        {t.editor.moveTo}
      </option>
      {options.map((s) => (
        <option key={s} value={s}>
          {STATUS_CONFIG[s].label}
        </option>
      ))}
    </select>
  );
}
