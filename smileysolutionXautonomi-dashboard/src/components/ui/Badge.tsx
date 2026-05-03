interface BadgeProps {
  label: string;
  color: string;
  size?: "sm" | "xs";
}

export function Badge({ label, color, size = "sm" }: BadgeProps) {
  const padding = size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium tracking-wide uppercase ${padding}`}
      style={{
        color,
        background: `${color}18`,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  );
}
