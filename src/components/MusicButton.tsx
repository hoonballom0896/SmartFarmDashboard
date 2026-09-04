import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import { MODE_LABEL, useMusic } from '../lib/MusicContext'

function fmt(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Icon per playback mode: 믹스업(shuffle) / 차례대로(sequential) / 한 곡 반복(repeat).
function ModeIcon({ mode }: { mode: string }) {
  if (mode === 'shuffle') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
      </svg>
    )
  }
  if (mode === 'repeat') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 2l4 4-4 4M7 22l-4-4 4-4M21 6H8a4 4 0 0 0-4 4M3 18h13a4 4 0 0 0 4-4" />
        <text x="12" y="15" fontSize="8" fontWeight="700" textAnchor="middle" fill="currentColor" stroke="none">1</text>
      </svg>
    )
  }
  // sequential
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2l4 4-4 4M7 22l-4-4 4-4M21 6H8a4 4 0 0 0-4 4M3 18h13a4 4 0 0 0 4-4" />
    </svg>
  )
}

export default function MusicButton() {
  const [open, setOpen] = useState(false)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const {
    categories,
    fromBucket,
    fetching,
    bucketError,
    refresh,
    current,
    loadedId,
    loadingId,
    mode,
    cycleMode,
    time,
    duration,
    nowPlaying,
    playInCategory,
    togglePlay,
    skip,
    seekTo,
    setSeeking,
    setTime,
  } = useMusic()

  useEffect(() => {
    if (open && isSupabaseConfigured) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-music-root]')) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const playing = current !== null
  const seekPct = duration > 0 ? (time / duration) * 100 : 0
  const activeCategory = categories.find((c) => c.id === selectedCat) ?? null

  return (
    <div className="relative" data-music-root>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="음악 변경"
        aria-pressed={playing}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border bg-card transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          playing
            ? 'border-primary/60 text-primary'
            : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        {playing && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
        )}
      </button>

      {open && (
        <div className="animate-float-in absolute right-0 top-12 z-50 w-72 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-[var(--shadow-soft)]">
          {/* header */}
          <div className="flex items-center justify-between px-2 py-1.5">
            {activeCategory ? (
              <button
                onClick={() => setSelectedCat(null)}
                className="flex items-center gap-1.5 font-display text-sm font-medium transition hover:text-primary"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                {activeCategory.name}
              </button>
            ) : (
              <p className="font-display text-sm font-medium tracking-[0.1em] text-muted-foreground">
                장르 선택
              </p>
            )}
            {isSupabaseConfigured && (
              <button
                onClick={refresh}
                aria-label="보관함 새로고침"
                className="rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${fetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              </button>
            )}
          </div>

          {!fromBucket && isSupabaseConfigured && (
            <p className={`px-2 pb-1 text-[0.68rem] ${bucketError ? 'text-accent' : 'text-muted-foreground'}`}>
              {fetching
                ? '보관함을 불러오는 중…'
                : bucketError
                  ? bucketError
                  : "'music' 버킷에 곡을 올리면 여기 표시돼요 (지금은 샘플)"}
            </p>
          )}

          {/* category list */}
          {!activeCategory && (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {categories.map((cat) => {
                const catActive = cat.tracks.some((t) => t.id === loadedId)
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                      catActive ? 'bg-secondary' : 'hover:bg-secondary/60'
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7l2-2h5l2 2h9v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{cat.name}</span>
                      <span className="block text-xs text-muted-foreground">{cat.tracks.length}곡</span>
                    </span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )
              })}
            </div>
          )}

          {/* songs inside a category */}
          {activeCategory && (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {activeCategory.tracks.map((track) => {
                const active = current === track.id
                const loaded = loadedId === track.id
                return (
                  <button
                    key={track.id}
                    onClick={() => playInCategory(track, activeCategory)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                      loaded ? 'bg-secondary' : 'hover:bg-secondary/60'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        active ? 'bg-primary text-primary-foreground' : 'bg-background text-primary'
                      }`}
                    >
                      {loadingId === track.id ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M21 12a9 9 0 1 1-6.2-8.5" strokeLinecap="round" />
                        </svg>
                      ) : active ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                          <rect x="6" y="5" width="4" height="14" rx="1" />
                          <rect x="14" y="5" width="4" height="14" rx="1" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{track.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {loaded && !active ? '일시정지됨' : track.mood}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* now playing + controls */}
          {nowPlaying && (
            <div className="mt-2 rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => skip(-1)}
                  aria-label="이전 곡"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M6 5h2v14H6zM20 5l-11 7 11 7z" />
                  </svg>
                </button>
                <button
                  onClick={togglePlay}
                  aria-label={playing ? '일시정지' : '재생'}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90"
                >
                  {playing ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => skip(1)}
                  aria-label="다음 곡"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M16 5h2v14h-2zM4 5l11 7-11 7z" />
                  </svg>
                </button>
                <button
                  onClick={cycleMode}
                  aria-label={`재생 모드: ${MODE_LABEL[mode]} (눌러서 변경)`}
                  title={`재생 모드: ${MODE_LABEL[mode]}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent transition hover:bg-accent/30"
                >
                  <ModeIcon mode={mode} />
                </button>
                <div className="min-w-0 flex-1 pl-1 text-right">
                  <p className="truncate text-sm font-medium">{nowPlaying.name}</p>
                  <p className="truncate text-[0.68rem] text-muted-foreground">
                    {MODE_LABEL[mode]} · {nowPlaying.mood}
                  </p>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(time, duration || 0)}
                onPointerDown={() => setSeeking(true)}
                onChange={(e) => setTime(Number(e.target.value))}
                onPointerUp={(e) => {
                  setSeeking(false)
                  seekTo(Number((e.target as HTMLInputElement).value))
                }}
                onKeyUp={(e) => seekTo(Number((e.target as HTMLInputElement).value))}
                aria-label="재생 위치"
                className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow"
                style={{
                  background: `linear-gradient(to right, var(--primary) ${seekPct}%, var(--sensor-track) ${seekPct}%)`,
                }}
              />
              <div className="mt-1 flex justify-between font-mono text-[0.65rem] text-muted-foreground">
                <span>{fmt(time)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
