import type { CSSProperties } from "react";

export function PawPrint({
  className,
  size = 28,
  style,
}: {
  className?: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden
    >
      <ellipse cx="10" cy="9" rx="3.2" ry="4" />
      <ellipse cx="16" cy="6.5" rx="3.2" ry="4" />
      <ellipse cx="22" cy="9" rx="3.2" ry="4" />
      <ellipse cx="16" cy="20" rx="7" ry="6.2" />
    </svg>
  );
}
