"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { PERSONA_CONFIG, STATUS_CONFIG, type ContentStatus, type ClientPersona } from "@/types/content";
import { t } from "@/lib/i18n/he";

interface CardData {
  id: string;
  title: string;
  client_persona?: string | null;
  status: string;
  content_type?: string | null;
  feed_copy_en?: string | null;
  updated_at?: string | null;
}

interface KanbanCardProps {
  piece: CardData;
  isDragging?: boolean;
}

export function KanbanCard({ piece, isDragging = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, active } =
    useSortable({ id: piece.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const personaConfig =
    piece.client_persona && piece.client_persona in PERSONA_CONFIG
      ? PERSONA_CONFIG[piece.client_persona as ClientPersona]
      : null;

  const statusConfig = STATUS_CONFIG[piece.status as ContentStatus];

  const isBeingDragged = active?.id === piece.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        card p-3 cursor-grab active:cursor-grabbing transition-all duration-150
        ${isDragging ? "shadow-2xl shadow-black/40 scale-105" : ""}
        ${isBeingDragged ? "opacity-40" : "hover:border-[var(--border-default)]"}
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-snug flex-1">
          {piece.title}
        </p>
        <div
          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
          style={{ backgroundColor: statusConfig?.color ?? "#6B7280" }}
        />
      </div>

      <div className="flex items-center justify-between">
        {personaConfig ? (
          <Badge label={personaConfig.label} color={personaConfig.color} size="xs" />
        ) : (
          <span />
        )}

        <Link
          href={`/content/${piece.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
        >
          {t.actions.edit}
        </Link>
      </div>
    </div>
  );
}
