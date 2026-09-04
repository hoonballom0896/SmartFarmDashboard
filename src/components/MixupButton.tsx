import { useMusic } from '../lib/MusicContext'

/**
 * Main-screen shortcut: shuffle every track across all genres and start
 * playing, without opening the music dropdown.
 */
export default function MixupButton() {
  const { mixAllGenres, mode, current } = useMusic()
  const active = mode === 'shuffle' && current !== null

  return (
    <button
      onClick={mixAllGenres}
      aria-label="전체 장르 믹스업"
      title="전체 장르 믹스업"
      className={`flex h-10 w-10 items-center justify-center rounded-full border bg-card transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? 'border-accent/60 text-accent'
          : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
      </svg>
    </button>
  )
}
