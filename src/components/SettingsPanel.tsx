import { useEffect, useState } from 'react'
import { PLANTS, type PlantId, type ThemeMode } from '../farm'

export const APP_VERSION = '1.2.0'
export const APP_BUILD = '104'
export const APP_RELEASED = '2026.08.18'

type Props = {
  theme: ThemeMode
  plant: PlantId
  onTheme: (t: ThemeMode) => void
  onPlant: (p: PlantId) => void
  onHarvest: () => Promise<void>
  onClose: () => void
}

export default function SettingsPanel({ theme, plant, onTheme, onPlant, onHarvest, onClose }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [harvesting, setHarvesting] = useState(false)

  const doHarvest = async () => {
    setHarvesting(true)
    try {
      await onHarvest()
      setConfirming(false)
    } finally {
      setHarvesting(false)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="설정">
      <button aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />

      <aside className="animate-float-in relative flex h-full w-full max-w-sm flex-col border-l border-border bg-popover p-6 text-popover-foreground shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">설정</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* theme */}
        <section className="mt-8">
          <p className="font-display text-sm font-medium tracking-[0.1em] text-muted-foreground">테마</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(['light', 'dark'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onTheme(mode)}
                className={`rounded-2xl border p-4 text-left transition ${
                  theme === mode
                    ? 'border-primary bg-secondary'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <span className="text-2xl">{mode === 'light' ? '☀️' : '🌙'}</span>
                <p className="mt-2 text-sm font-medium">
                  {mode === 'light' ? '라이트' : '다크'}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* plant */}
        <section className="mt-8">
          <p className="font-display text-sm font-medium tracking-[0.1em] text-muted-foreground">키우는 식물</p>
          <div className="mt-3 space-y-3">
            {Object.values(PLANTS).map((p) => (
              <button
                key={p.id}
                onClick={() => onPlant(p.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  plant === p.id
                    ? 'border-primary bg-secondary'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-2xl">
                  {p.emoji}
                </span>
                <div>
                  <p className="font-display text-lg font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.tagline}</p>
                </div>
                {plant === p.id && (
                  <svg viewBox="0 0 24 24" className="ml-auto h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* harvest */}
        <section className="mt-8">
          <p className="font-display text-sm font-medium tracking-[0.1em] text-muted-foreground">수확</p>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-500/20 dark:text-red-400"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6" />
              </svg>
              수확 완료
            </button>
          ) : (
            <div className="mt-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                모든 다이어리 기록과 사진이 영구 삭제돼요. 계속할까요?
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  disabled={harvesting}
                  className="rounded-xl border border-border bg-card py-2.5 text-sm font-medium transition hover:border-primary/40 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={doHarvest}
                  disabled={harvesting}
                  className="rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {harvesting ? '삭제 중…' : '전부 삭제'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* app info */}
        <section className="mt-8">
          <p className="font-display text-sm font-medium tracking-[0.1em] text-muted-foreground">웹 정보</p>
          <dl className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {[
              ['앱 이름', '그로팜 GrowFarm'],
              ['버전', `v${APP_VERSION}`],
              ['빌드', `#${APP_BUILD}`],
              ['릴리스', APP_RELEASED],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-mono font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-auto pt-6 text-center text-xs text-muted-foreground">
          스마트팜과 연동되어 실시간으로 반영됩니다
        </p>
      </aside>
    </div>
  )
}
