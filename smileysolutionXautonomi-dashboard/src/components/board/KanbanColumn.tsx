"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { STATUS_CONFIG, type ContentStatus } from "@/types/content";
import { t } from "@/lib/i18n/he";

interface KanbanColumnProps {
  status: ContentStatus;
  label: string;
  pieces: Array<Record<string, unknown>>;
  isLoading: boolean;
}

export function KanbanColumn({ status, label, pieces, isLoading }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];

  return (
    <div
      ref={setNodeRef}
      className={`
        w-72 flex flex-col rounded-xl border transition-colors duration-200
        ${isOver
          ? "border-[var(--border-strong)] bg-[var(--bg-raised)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
        }
      `}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
            {label}
          </span>
        </div>
        <span className="text-xs text-[var(--text-tertiary)] font-mono">
          {pieces.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
        {isLoading ? (
          <SkeletonCards />
        ) : pieces.length === 0 ? (
          <DropZoneHint />
        ) : (
          <SortableContext
            items={pieces.map((p) => p.id as string)}
            strategy={verticalListSortingStrategy}
          >
            {pieces.map((piece) => (
              <KanbanCard key={piece.id as string} piece={piece as unknown as Parameters<typeof KanbanCard>[0]['piece']} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

function DropZoneHint() {
  return (
    <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-[var(--border-subtle)]">
      <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">
        {t.board.dropHere}
      </p>
    </div>
  );
}

function SkeletonCards() {
  return (
    <>
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-20 rounded-lg bg-[var(--bg-overlay)] animate-pulse"
        />
      ))}
    </>
  );
}
