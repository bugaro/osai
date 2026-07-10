/**
 * AppHeader — React Server Component
 *
 * Renders the OSAI brand logo and application title at the top of the
 * operator dashboard. Static, no client-side interactivity.
 */
export default function AppHeader() {
  return (
    <header className="w-full border-b border-slate-800 p-4 flex items-center justify-between bg-[#0E1424]">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        {/* OSAI quarter-circle logo */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="text-emerald-450 flex-shrink-0"
        >
          <path
            d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8836 42.134C8.29744 39.7376 5.50337 36.3291 3.85427 32.3373C2.20516 28.3455 1.77136 23.9564 2.60574 19.7199C3.44011 15.4833 5.50323 11.5993 8.52757 8.57494C11.5519 5.5506 15.4359 3.48748 19.6724 2.65311C23.909 1.81874 28.2981 2.25254 32.2899 3.90164C36.2817 5.55075 39.6902 8.34482 42.0866 11.9309C44.483 15.5171 45.7622 19.7338 45.7622 24.0473L39.7622 24.0473C39.7622 20.9083 38.8303 17.8395 37.0855 15.2282C35.3407 12.6169 32.8607 10.5782 29.9593 9.36775C27.0579 8.15733 23.8618 7.83194 20.7775 8.43513C17.6931 9.03832 14.8604 10.5437 12.6363 12.7678C10.4122 14.9919 8.90685 17.8247 8.30366 20.909C7.70047 23.9933 8.02586 27.1895 9.23628 30.0908C10.4467 32.9922 12.4854 35.4723 15.0967 37.2171C17.708 38.9619 20.7768 39.8937 23.9158 39.8937L24 45.8096Z"
            fill="currentColor"
          />
          <circle cx="24" cy="24" r="5" fill="currentColor" />
        </svg>

        <h2 className="text-white text-xl font-bold tracking-tight">
          OSAI Autonomous Operations Terminal
        </h2>
      </div>
    </header>
  );
}
