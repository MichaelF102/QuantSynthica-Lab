import { useId } from "react";

/**
 * QuantSynthica "QS" monogram (DESIGN.md §11): bold stroked Q and S (stroke 13, 128×80 viewBox)
 * cut by a rising swoosh. Strokes above the swoosh use currentColor; strokes below use the
 * brand gradient #1D4ED8 → #38BDF8.
 */
export default function QSLogoMark({
  className = "h-8 w-[51px]",
  title = "QuantSynthica",
}: {
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const grad = `qs-grad-${uid}`;
  const above = `qs-above-${uid}`;
  const below = `qs-below-${uid}`;

  const letters = (
    <g fill="none" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx={36} cy={38} rx={21} ry={24} />
      <path d="M45 52 L60 69" />
      <path d="M112 21 C104 11 78 11 78 27 C78 43 112 37 112 54 C112 70 84 70 76 60" />
    </g>
  );

  return (
    <svg viewBox="0 0 128 80" className={className} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <defs>
        <linearGradient id={grad} x1="0" y1="80" x2="128" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1D4ED8" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
        <clipPath id={above}>
          <path d="M0 0 H128 V12.4 L0 63.6 Z" />
        </clipPath>
        <clipPath id={below}>
          <path d="M0 80 H128 V20.4 L0 71.6 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${above})`} stroke="currentColor">
        {letters}
      </g>
      <g clipPath={`url(#${below})`} stroke={`url(#${grad})`}>
        {letters}
      </g>
      <path d="M2 69 Q64 44 126 14" fill="none" stroke={`url(#${grad})`} strokeWidth={4.5} strokeLinecap="round" />
    </svg>
  );
}
