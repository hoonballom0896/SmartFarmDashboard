import { useRef, useState } from 'react'
import type { Plant } from '../farm'
import type { DiaryEntry } from '../lib/diaryStore'
import { latestFarmPhoto } from '../lib/diaryStore'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

type Props = {
  plant: Plant
  entries: DiaryEntry[]
  loading: boolean
  configured: boolean
  onGrow: () => void
  onAdd: (input: { title: string; body: string; photo: Blob | null }) => Promise<unknown>
}

export default function Diary({
  plant,
  entries = [],
  loading = false,
  configured = false,
  onGrow,
  onAdd,
}: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [saving, setSaving] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const pullFarmPhoto = async () => {
    setPulling(true)
    setMsg(null)
    try {
      const shot = await latestFarmPhoto()
      if (shot) {
        setPhoto(shot.blob)
        setPreview(shot.url)
      } else {
        setMsg('스마트팜 사진을 찾지 못했어요')
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '스마트팜 사진을 불러오지 못했어요')
    } finally {
      setPulling(false)
    }
  }

  const canSubmit = (title.trim() !== '' || body.trim() !== '' || photo) && !saving

  const addEntry = async () => {
    if (!canSubmit) return
    setSaving(true)
    setMsg(null)
    try {
      await onAdd({ title: title.trim() || '오늘의 기록', body: body.trim(), photo })
      setTitle('')
      setBody('')
      setPhoto(null)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      onGrow()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '저장에 실패했어요')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <div className="shrink-0">
        <p className="font-display text-sm font-medium tracking-[0.2em] text-muted-foreground">
          성장 일기
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold sm:text-3xl">
          {plant.name} 다이어리
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          기록을 남길 때마다 식물이 한 단계씩 자라요 · 클라우드에 자동 저장돼요
        </p>
      </div>

      {/* composer */}
      <div className="mt-4 shrink-0 rounded-[var(--radius)] border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
        <div className="flex gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/50 text-muted-foreground transition hover:border-primary/60"
          >
            {preview ? (
              <img src={preview} alt="업로드 미리보기" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-xs">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 16l4-4 4 3 3-4 5 5M4 6h16v12H4z" />
                </svg>
                사진
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
          <div className="flex flex-1 flex-col gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="오늘 식물은 어떤가요?"
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={pullFarmPhoto}
            disabled={pulling || !configured}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {pulling ? '불러오는 중…' : '스마트팜 사진 가져오기'}
          </button>
          <button
            onClick={addEntry}
            disabled={!canSubmit}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? '저장 중…' : '기록 남기기'}
          </button>
        </div>
        {msg && <p className="mt-2 text-xs text-accent">{msg}</p>}
        {!configured && (
          <p className="mt-2 text-xs text-accent">
            Supabase 연결 후 저장·불러오기가 활성화돼요
          </p>
        )}
      </div>

      {/* timeline */}
      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pb-2 pr-1">
        {loading && (
          <div className="flex h-full items-center justify-center py-12 text-sm text-muted-foreground">
            기록을 불러오는 중…
          </div>
        )}
        {!loading && entries.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-border py-12 text-center">
            <span className="text-3xl">🌱</span>
            <p className="mt-3 font-display text-base font-medium">아직 기록이 없어요</p>
            <p className="mt-1 text-sm text-muted-foreground">첫 번째 성장 순간을 남겨보세요</p>
          </div>
        )}
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="animate-float-in overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-[var(--shadow-soft)]"
          >
            {entry.photo && (
              <div className="aspect-[16/9] w-full bg-secondary">
                <img src={entry.photo} alt={entry.title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {formatDate(entry.date)}
              </p>
              <h3 className="mt-1.5 font-display text-xl font-semibold">{entry.title}</h3>
              {entry.body && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{entry.body}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
