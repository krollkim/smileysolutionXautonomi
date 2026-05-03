"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { showToast } from "@/components/ui/Toast";
import type { ContentStatus } from "@/types/content";
import { t } from "@/lib/i18n/he";

const COLUMNS: Array<{ status: ContentStatus; label: string }> = [
  { status: "draft",     label: t.board.columns.draft     },
  { status: "approved",  label: t.board.columns.approved  },
  { status: "produced",  label: t.board.columns.produced  },
  { status: "published", label: t.board.columns.published },
];

export function KanbanBoard() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Fetch all production content
  const queries = COLUMNS.map((col) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    trpc.content.list.useQuery({ status: col.status, limit: 50 })
  );

  const transitionMutation = trpc.content.transition.useMutation({
    onSuccess: () => {
      queries.forEach((q) => void q.refetch());
    },
    onError: () => {
      showToast(t.board.toastMoveFailed, "error");
      queries.forEach((q) => void q.refetch());
    },
  });

  const allPieces = queries.flatMap((q) => q.data?.items ?? []);
  const activeCard = activeId ? allPieces.find((p) => p.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const newStatus = over.id as ContentStatus;
    const validStatuses: ContentStatus[] = ["draft", "approved", "produced", "published"];

    if (!validStatuses.includes(newStatus)) return;

    transitionMutation.mutate({
      id: active.id as string,
      status: newStatus,
    });
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-[var(--border-subtle)]">
        <h1 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          {t.board.heading}
        </h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {t.board.subheading}
        </p>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 px-8 py-6 h-full min-w-max">
            {COLUMNS.map((col, idx) => (
              <motion.div
                key={col.status}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3 }}
              >
                <KanbanColumn
                  status={col.status}
                  label={col.label}
                  pieces={queries[idx]?.data?.items ?? []}
                  isLoading={queries[idx]?.isLoading ?? false}
                />
              </motion.div>
            ))}
          </div>

          <DragOverlay>
            {activeCard && (
              <div className="rotate-2 opacity-90">
                <KanbanCard piece={activeCard as Parameters<typeof KanbanCard>[0]['piece']} isDragging />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
