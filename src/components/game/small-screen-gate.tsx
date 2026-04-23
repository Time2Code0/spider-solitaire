export function SmallScreenGate() {
  return (
    <div className="small-screen-notice fixed inset-0 z-50 flex-col items-center justify-center gap-4 bg-felt-deep p-8 text-center">
      <div aria-hidden className="felt-backdrop absolute inset-0 -z-10" />
      <svg
        aria-hidden
        className="size-14 text-gold"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <title>Spider web icon</title>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v6m0 8v6M2 12h6m8 0h6M5 5l4 4m6 6 4 4M19 5l-4 4m-6 6-4 4" />
      </svg>
      <h1 className="max-w-lg text-balance font-semibold text-2xl text-ink leading-tight">
        Spider Solitaire needs a larger screen
      </h1>
      <p className="max-w-md text-ink-dim text-sm">
        This game is designed for desktop and laptop displays. Open this page on
        a screen that is at least 1024&nbsp;px wide and 700&nbsp;px tall to
        start playing.
      </p>
    </div>
  );
}
