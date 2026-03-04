export default function BrandLogo({ compact = false }) {
  if (compact) {
    return (
      <svg
        viewBox="0 0 72 72"
        className="h-12 w-12 shrink-0"
        role="img"
        aria-label="StarConnect Africa"
      >
        <circle cx="36" cy="36" r="28" fill="none" stroke="#19b66b" strokeWidth="7" strokeDasharray="110 66" strokeLinecap="round" transform="rotate(132 36 36)" />
        <circle cx="36" cy="36" r="28" fill="none" stroke="#1aa4e8" strokeWidth="7" strokeDasharray="110 66" strokeLinecap="round" transform="rotate(318 36 36)" />
        <circle cx="28" cy="28" r="15" fill="none" stroke="#ef312f" strokeWidth="7" />
        <circle cx="28" cy="28" r="5.5" fill="#efba26" />
        <circle cx="56" cy="12" r="5.2" fill="#1aa4e8" />
        <circle cx="10" cy="56" r="5.2" fill="#19b66b" />
        <path d="M38 38 L55 55" stroke="#ef312f" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <div className="min-w-0">
      <svg
        viewBox="0 0 760 160"
        className="h-16 w-auto max-w-full"
        role="img"
        aria-label="StarConnect Africa Internet Without Limits"
      >
        <rect width="760" height="160" fill="transparent" />
        <g transform="translate(4 6)">
          <circle cx="72" cy="72" r="56" fill="none" stroke="#19b66b" strokeWidth="10" strokeDasharray="222 120" strokeLinecap="round" transform="rotate(132 72 72)" />
          <circle cx="72" cy="72" r="56" fill="none" stroke="#1aa4e8" strokeWidth="10" strokeDasharray="222 120" strokeLinecap="round" transform="rotate(318 72 72)" />
          <circle cx="56" cy="56" r="30" fill="none" stroke="#ef312f" strokeWidth="10" />
          <circle cx="56" cy="56" r="10.5" fill="#efba26" />
          <circle cx="112" cy="18" r="10" fill="#1aa4e8" />
          <circle cx="18" cy="112" r="10" fill="#19b66b" />
          <path d="M76 76 L112 112" stroke="#ef312f" strokeWidth="8" strokeLinecap="round" />
        </g>
        <text
          x="170"
          y="78"
          fill="#173f8f"
          fontSize="54"
          fontWeight="700"
          fontFamily="Avenir Next, Segoe UI, Arial, sans-serif"
          letterSpacing="-1"
        >
          StarConnect Africa
        </text>
        <text
          x="254"
          y="118"
          fill="#15a9e7"
          fontSize="18"
          fontWeight="700"
          fontFamily="Avenir Next, Segoe UI, Arial, sans-serif"
          letterSpacing="8"
        >
          INTERNET WITHOUT LIMITS
        </text>
      </svg>
    </div>
  );
}
