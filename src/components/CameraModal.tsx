import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

const URL_KEY = 'growfarm.cam.url'
const TYPE_KEY = 'growfarm.cam.type'

type StreamType = 'mjpeg' | 'video'

type Props = {
  plantName: string
  onClose: () => void
}

export default function CameraModal({ plantName, onClose }: Props) {
  const [url, setUrl] = useState(() => localStorage.getItem(URL_KEY) ?? '')
  const [type, setType] = useState<StreamType>(
    () => (localStorage.getItem(TYPE_KEY) as StreamType) ?? 'mjpeg',
  )
  const [draftUrl, setDraftUrl] = useState(url)
  const [draftType, setDraftType] = useState<StreamType>(type)
  const [editing, setEditing] = useState(!url)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Wire up <video> for direct video / HLS streams.
  useEffect(() => {
    if (editing || type !== 'video' || !url) return
    const video = videoRef.current
    if (!video) return
    setError(null)

    let hls: Hls | undefined
    if (/\.m3u8($|\?)/.test(url)) {
      if (Hls.isSupported()) {
        hls = new Hls({ liveDurationInfinity: true })
        hls.loadSource(url)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) setError('영상 스트림을 불러오지 못했어요')
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url
      } else {
        setError('이 브라우저에서는 HLS 재생을 지원하지 않아요')
      }
    } else {
      video.src = url
    }
    video.play().catch(() => {})

    return () => hls?.destroy()
  }, [url, type, editing, reloadKey])

  const save = () => {
    const u = draftUrl.trim()
    setUrl(u)
    setType(draftType)
    localStorage.setItem(URL_KEY, u)
    localStorage.setItem(TYPE_KEY, draftType)
    setEditing(false)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="실시간 카메라">
      <button aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />

      <div className="animate-float-in relative w-full max-w-xl overflow-hidden rounded-[calc(var(--radius)+0.5rem)] border border-border bg-popover text-popover-foreground shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <h2 className="font-display text-lg font-semibold">{plantName} 실시간 카메라</h2>
          </div>
          <div className="flex items-center gap-1">
            {!editing && url && (
              <>
                <button
                  onClick={() => setReloadKey((k) => k + 1)}
                  aria-label="새로고침"
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setDraftUrl(url)
                    setDraftType(type)
                    setEditing(true)
                  }}
                  aria-label="카메라 설정"
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                  </svg>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              aria-label="닫기"
              className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>

        {editing ? (
          <div className="p-5">
            <label className="block text-sm font-medium">카메라 스트림 주소</label>
            <p className="mt-1 text-xs text-muted-foreground">
              스마트팜 카메라가 Wi-Fi에 연결되면 받은 로컬 주소를 입력하세요.
            </p>
            <input
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="예: http://192.168.0.42:81/stream"
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-3">
              <span className="text-sm font-medium">스트림 형식</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  [
                    ['mjpeg', 'MJPEG / 스냅샷'],
                    ['video', '비디오 · HLS(.m3u8)'],
                  ] as [StreamType, string][]
                ).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setDraftType(val)}
                    className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                      draftType === val ? 'border-primary bg-secondary' : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              {url && (
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/40"
                >
                  취소
                </button>
              )}
              <button
                onClick={save}
                disabled={!draftUrl.trim()}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                연결
              </button>
            </div>
          </div>
        ) : (
          <div className="relative aspect-video w-full bg-black">
            {type === 'mjpeg' ? (
              <img
                key={reloadKey}
                src={url}
                alt={`${plantName} 실시간 화면`}
                className="h-full w-full object-contain"
                onError={() => setError('카메라에 연결하지 못했어요. 주소와 네트워크를 확인하세요.')}
                onLoad={() => setError(null)}
              />
            ) : (
              <video
                ref={videoRef}
                className="h-full w-full object-contain"
                autoPlay
                muted
                playsInline
                controls
              />
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center text-white">
                <p className="text-sm">{error}</p>
                <button
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="rounded-xl bg-white/15 px-4 py-2 text-sm font-medium transition hover:bg-white/25"
                >
                  다시 시도
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
