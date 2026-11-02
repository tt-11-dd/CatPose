export function CatLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M8 28 20 6c2.2-1.2 6 1 8 7l-2 13" fill="#E39B4A" />
      <path d="M56 28 44 6c-2.2-1.2-6 1-8 7l2 13" fill="#F6E3C8" />
      <path d="M18 12c1.5-4 4-6 6.5-5.2 1.4 4-1 8-4.5 11" fill="#F5B7C5" />
      <path d="M46 12c-1.5-4-4-6-6.5-5.2-1.4 4 1 8 4.5 11" fill="#F5B7C5" />
      <ellipse cx="32" cy="36" rx="23" ry="21" fill="#FFF8EE" />
      <path d="M11 32c1.5-12 9-20 18-17 3 10-3 18-12 24-4 2.2-6.5-0.5-6-7z" fill="#E39B4A" />
      <ellipse cx="24.5" cy="36.5" rx="3.6" ry="4.6" fill="#3C2415" />
      <ellipse cx="40.5" cy="36.5" rx="3.6" ry="4.6" fill="#3C2415" />
      <circle cx="25.7" cy="35" r="1.15" fill="white" />
      <circle cx="41.7" cy="35" r="1.15" fill="white" />
      <ellipse cx="32" cy="43.2" rx="2" ry="1.45" fill="#C9844A" />
      <path
        d="M28.5 47.2c2 2.1 5 2.1 7 0"
        stroke="#C9844A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
