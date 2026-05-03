"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n/he";

const NAV_ITEMS = [
  {
    href: "/inbox",
    label: t.nav.inbox.label,
    icon: InboxIcon,
    description: t.nav.inbox.description,
  },
  {
    href: "/board",
    label: t.nav.board.label,
    icon: BoardIcon,
    description: t.nav.board.description,
  },
  {
    href: "/gallery",
    label: t.nav.gallery.label,
    icon: GalleryIcon,
    description: t.nav.gallery.description,
  },
  {
    href: "/analytics",
    label: t.nav.analytics.label,
    icon: AnalyticsIcon,
    description: t.nav.analytics.description,
  },
  {
    href: "/personas",
    label: t.nav.personas.label,
    icon: PersonasIcon,
    description: t.nav.personas.description,
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-[220px] shrink-0 h-full border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border-subtle)]">
        <p className="font-display text-sm font-semibold text-[var(--text-primary)] tracking-wide">
          {t.brand.name}
        </p>
        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 tracking-widest uppercase">
          {t.brand.studio}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-md
                  text-sm transition-colors duration-150
                  ${isActive
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)]"
                  }
                `}
                whileHover={{ x: 1 }}
                transition={{ duration: 0.15 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-[var(--bg-overlay)] rounded-md border border-[var(--border-default)]"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10 shrink-0">
                  <Icon size={16} active={isActive} />
                </span>
                <span className="relative z-10 font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Accent dot + version */}
      <div className="px-5 py-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] glow-accent" />
          <span className="text-[10px] text-[var(--text-tertiary)] tracking-widest uppercase">
            {t.brand.live}
          </span>
        </div>
      </div>
    </aside>
  );
}

// ─── Icon Components ──────────────────────────────────────────────────────────

function InboxIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M2 4h12M2 8h8M2 12h6"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BoardIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect
        x="1" y="2" width="4" height="12" rx="1"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
      />
      <rect
        x="6" y="2" width="4" height="8" rx="1"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
      />
      <rect
        x="11" y="2" width="4" height="5" rx="1"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function GalleryIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect
        x="1" y="1" width="6" height="6" rx="1"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
      />
      <rect
        x="9" y="1" width="6" height="6" rx="1"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
      />
      <rect
        x="1" y="9" width="6" height="6" rx="1"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
      />
      <rect
        x="9" y="9" width="6" height="6" rx="1"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function AnalyticsIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M2 12l3.5-4 3 2.5L12 4"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="2" cy="12" r="1"
        fill={active ? "var(--accent)" : "currentColor"}
      />
      <circle
        cx="12" cy="4" r="1"
        fill={active ? "var(--accent)" : "currentColor"}
      />
    </svg>
  );
}

function PersonasIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle
        cx="6" cy="5" r="3"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
      />
      <path
        d="M1 14c0-2.761 2.239-5 5-5"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="12" cy="7" r="2"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
      />
      <path
        d="M9 14c0-1.657 1.343-3 3-3"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
