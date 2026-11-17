export function Mark({ className = '' }: { className?: string }) {
  return (
    <div className={`mira-mark ${className}`} aria-hidden>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <defs>
          <radialGradient id="mira-glass" cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0.08" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.22" />
          </radialGradient>
          <linearGradient id="mira-sheen" x1="18" y1="14" x2="44" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
            <stop offset="45%" stopColor="currentColor" stopOpacity="0.08" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer pulse ring */}
        <circle className="mira-mark__pulse" cx="32" cy="32" r="27" stroke="currentColor" strokeWidth="1" />

        {/* Mirror rim */}
        <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2.25" opacity="0.72" />
        <circle cx="32" cy="32" r="19.5" stroke="currentColor" strokeWidth="0.75" opacity="0.28" />

        {/* Glass face */}
        <circle className="mira-mark__face" cx="32" cy="32" r="18" fill="url(#mira-glass)" />
        <circle cx="32" cy="32" r="18" fill="url(#mira-sheen)" />

        {/* Soft reflection highlight */}
        <path
          className="mira-mark__gleam"
          d="M22 20c4.5-5 12-6.5 17-3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.45"
        />
      </svg>
    </div>
  )
}
