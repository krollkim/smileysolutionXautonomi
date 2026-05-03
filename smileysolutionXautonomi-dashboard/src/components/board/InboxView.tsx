"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { useContentStore } from "@/stores/useContentStore";
import { InboxCard } from "./InboxCard";
import { showToast } from "@/components/ui/Toast";
import type { ContentStatus, ClientPersona } from "@/types/content";
import { t } from "@/lib/i18n/he";

const TABS = [
  { id: "all",     label: t.inbox.tabAll     },
  { id: "starred", label: t.inbox.tabStarred },
  { id: "today",   label: t.inbox.tabToday   },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function InboxView() {
  const { inboxFilters, setInboxFilter, focusedInboxIndex, setFocusedInboxIndex } =
    useContentStore();

   const utils = trpc.useUtils();

  // "All" and "Today" show both inbox + starred; "Starred" shows only starred
  const queryInput =
    inboxFilters.tab === "starred"
      ? { status: "starred" as ContentStatus, persona: inboxFilters.persona ?? undefined, limit: 20, offset: 0 }
      : { statuses: ["inbox", "starred"] as ContentStatus[], persona: inboxFilters.persona ?? undefined, limit: 20, offset: 0 };

  const { data } = trpc.content.list.useQuery(queryInput);

  // Authoritative counts — not derived from the current page's items
  const { data: counts } = trpc.content.inboxCounts.useQuery();

  const invalidateAll = useCallback(() => {
    void utils.content.list.invalidate();
    void utils.content.inboxCounts.invalidate();
  }, [utils]);

  // ─── Supabase Realtime — auto-refresh when new content arrives ────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("inbox-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "content_pieces" },
        () => {
          invalidateAll();
          showToast(t.inbox.toastNew);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [invalidateAll]);

  const transitionMutation = trpc.content.transition.useMutation({
    onSuccess: invalidateAll,
  });

  const pieces = data?.items ?? [];

  // ─── Keyboard Navigation ───────────────────────────────────────────────────

  const handleApprove = useCallback(
    async (id: string) => {
      await transitionMutation.mutateAsync({ id, status: "draft" });
      showToast(t.inbox.toastApproved);
    },
    [transitionMutation]
  );

  const handleReject = useCallback(
    async (id: string) => {
      await transitionMutation.mutateAsync({ id, status: "archived" });
      showToast(t.inbox.toastRejected);
    },
    [transitionMutation]
  );

  const handleStar = useCallback(
    async (id: string) => {
      const piece = pieces.find((p) => p.id === id);
      const newStatus: ContentStatus =
        piece?.status === "starred" ? "inbox" : "starred";
      await transitionMutation.mutateAsync({ id, status: newStatus });
    },
    [pieces, transitionMutation]
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const focused = focusedInboxIndex;
      const current = focused !== null ? pieces[focused] : null;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedInboxIndex(
          Math.min((focused ?? -1) + 1, pieces.length - 1)
        );
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedInboxIndex(Math.max((focused ?? 1) - 1, 0));
      } else if (e.key === "a" && current) {
        void handleApprove(current.id);
      } else if (e.key === "r" && current) {
        void handleReject(current.id);
      } else if (e.key === "s" && current) {
        void handleStar(current.id);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [focusedInboxIndex, pieces, setFocusedInboxIndex, handleApprove, handleReject, handleStar]);

  const filteredPieces =
    inboxFilters.tab === "today"
      ? pieces.filter((p) => {
          const date = new Date(p.created_at ?? p.createdAt ?? "");
          return date.toDateString() === new Date().toDateString();
        })
      : pieces;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              {t.inbox.heading}
            </h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {t.inbox.subheading}
            </p>
          </div>

          <ManualIngestButton onSuccess={invalidateAll} />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setInboxFilter({ tab: tab.id as TabId })}
              className={`
                px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${inboxFilters.tab === tab.id
                  ? "bg-[var(--bg-overlay)] text-[var(--text-primary)] border border-[var(--border-default)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }
              `}
            >
              {tab.label}
              {tab.id === "starred" && (counts?.starred ?? 0) > 0 && (
                <span className="ml-1.5 text-[9px] bg-amber-400/20 text-amber-400 rounded px-1">
                  {counts?.starred ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {filteredPieces.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {filteredPieces.map((piece, index) => (
                <InboxCard
                  key={piece.id}
                  piece={{
                    ...piece,
                    createdAt: piece.created_at ?? piece.createdAt ?? new Date().toISOString(),
                    updatedAt: piece.updated_at ?? piece.updatedAt ?? new Date().toISOString(),
                    clientPersona: piece.client_persona as ClientPersona | null | undefined,
                    feedCopyEn: piece.feed_copy_en ?? null,
                    storiesScriptHe: piece.stories_script_he ?? null,
                    visualDirection: piece.visual_direction ?? null,
                    sourceUrl: piece.source_url ?? null,
                    rawExcerpt: piece.raw_excerpt ?? null,
                    mediaAssets: piece.media_assets as Array<{url: string; type: "image"|"video"; alt: string}> | null,
                    viralSignals: piece.viral_signals as {label: "high_engagement"|"trending_topic"|"thought_leader"|"contrarian_take"|"timely_news"; engagementCount: number; trendTags: string[]; confidenceScore: number} | null,
                    contentType: piece.content_type as "feed"|"stories"|"both",
                    source: piece.source as "scoutbot"|"telegram"|"apify"|"manual",
                    scheduledAt: piece.scheduled_at ?? null,
                    publishedAt: piece.published_at ?? null,
                    tags: piece.tags ?? null,
                  }}
                  isFocused={focusedInboxIndex === index}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onStar={handleStar}
                  onClick={() => setFocusedInboxIndex(index)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--bg-raised)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
        <span className="text-lg">📭</span>
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)]">
        {t.inbox.emptyTitle}
      </p>
      <p className="text-xs text-[var(--text-tertiary)] mt-1">
        {t.inbox.emptyBody}
      </p>
    </div>
  );
}

// ─── Manual Ingest Button ─────────────────────────────────────────────────────

function ManualIngestButton({ onSuccess }: { onSuccess: () => void }) {
  return (
    <button
      onClick={() => {
        const title = prompt(t.inbox.promptTitle);
        const excerpt = prompt(t.inbox.promptExcerpt);
        if (!title || !excerpt) return;

        fetch("/api/ingest/manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, rawExcerpt: excerpt }),
        })
          .then((r) => r.json())
          .then((data: unknown) => {
            if (data && typeof data === "object" && "ok" in data && (data as { ok: boolean }).ok) {
              showToast(t.inbox.toastAdded);
              setTimeout(onSuccess, 3000);
            } else {
              showToast(t.inbox.toastAddFail, "error");
            }
          })
          .catch(() => showToast(t.inbox.toastAddFail, "error"));
      }}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)] transition-colors"
    >
      <span>+</span>
      {t.inbox.addManually}
    </button>
  );
}
