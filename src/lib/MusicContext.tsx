import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { isSupabaseConfigured } from './supabase'
import {
  allTracks,
  loadMusicLibrary,
  shuffle,
  type MusicCategory,
  type MusicTrack as Track,
} from './musicStore'

export type PlayMode = 'shuffle' | 'sequential' | 'repeat'
// Cycle order for the mode button: 믹스업 → 차례대로 → 한 곡 반복 → …
export const MODE_ORDER: PlayMode[] = ['shuffle', 'sequential', 'repeat']
export const MODE_LABEL: Record<PlayMode, string> = {
  shuffle: '믹스업',
  sequential: '차례대로',
  repeat: '한 곡 반복',
}

const SAMPLE_CATEGORIES: MusicCategory[] = [
  {
    id: 'sample-calm',
    name: '휴식',
    tracks: [
      { id: 's-calm-1', name: '잔잔한 오후', mood: '휴식', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      { id: 's-calm-2', name: '고요한 밤', mood: '휴식', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    ],
  },
  {
    id: 'sample-energy',
    name: '활력',
    tracks: [
      { id: 's-energy-1', name: '햇살 가득', mood: '활력', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
      { id: 's-energy-2', name: '아침 산책', mood: '활력', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    ],
  },
]

type MusicContextValue = {
  categories: MusicCategory[]
  fromBucket: boolean
  fetching: boolean
  bucketError: string | null
  refresh: () => Promise<void>
  current: string | null
  loadedId: string | null
  loadingId: string | null
  mode: PlayMode
  cycleMode: () => void
  time: number
  duration: number
  nowPlaying: Track | null
  playInCategory: (track: Track, cat: MusicCategory) => void
  togglePlay: () => void
  skip: (dir: 1 | -1) => void
  mixAllGenres: () => void
  seekTo: (value: number) => void
  setSeeking: (v: boolean) => void
  setTime: (v: number) => void
}

const MusicContext = createContext<MusicContextValue | null>(null)

function pickRandom(pool: Track[], excludeId: string | null): Track | null {
  if (pool.length === 0) return null
  if (pool.length === 1) return pool[0]
  const candidates = pool.filter((t) => t.id !== excludeId)
  const from = candidates.length ? candidates : pool
  return from[Math.floor(Math.random() * from.length)]
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<MusicCategory[]>(SAMPLE_CATEGORIES)
  const [fromBucket, setFromBucket] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [bucketError, setBucketError] = useState<string | null>(null)

  const [current, setCurrent] = useState<string | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [queue, setQueue] = useState<Track[]>([])
  const [mode, setMode] = useState<PlayMode>('sequential')
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const seekingRef = useRef(false)
  const advanceRef = useRef<() => void>(() => {})

  const refresh = async () => {
    if (!isSupabaseConfigured) return
    setFetching(true)
    setBucketError(null)
    try {
      const { categories: cats, error } = await loadMusicLibrary()
      if (cats.length) {
        setCategories(cats)
        setFromBucket(true)
      } else {
        setCategories(SAMPLE_CATEGORIES)
        setFromBucket(false)
        setBucketError(error)
      }
    } catch (e) {
      setCategories(SAMPLE_CATEGORIES)
      setFromBucket(false)
      setBucketError(e instanceof Error ? e.message : '음악을 불러오지 못했어요')
    } finally {
      setFetching(false)
    }
  }

  // Load the library once on mount.
  useEffect(() => {
    if (isSupabaseConfigured) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const audio = new Audio()
    audio.volume = 0.6
    audioRef.current = audio

    const onTime = () => {
      if (!seekingRef.current) setTime(audio.currentTime)
    }
    const onMeta = () => setDuration(audio.duration || 0)
    const onEnded = () => advanceRef.current()
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audio.src = ''
    }
  }, [])

  const startTrack = async (track: Track, nextQueue: Track[]) => {
    const audio = audioRef.current
    if (!audio) return
    setQueue(nextQueue)
    audio.src = track.src
    setLoadedId(track.id)
    setTime(0)
    setDuration(0)
    setLoadingId(track.id)
    try {
      await audio.play()
      setCurrent(track.id)
    } catch {
      setCurrent(null)
    } finally {
      setLoadingId(null)
    }
  }

  const playInCategory = async (track: Track, cat: MusicCategory) => {
    const audio = audioRef.current
    if (!audio) return
    if (loadedId === track.id) {
      if (current === track.id) {
        audio.pause()
        setCurrent(null)
      } else {
        try {
          await audio.play()
          setCurrent(track.id)
        } catch {
          setCurrent(null)
        }
      }
      return
    }
    startTrack(track, cat.tracks)
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio || !loadedId) return
    if (current) {
      audio.pause()
      setCurrent(null)
    } else {
      audio.play().then(() => setCurrent(loadedId)).catch(() => setCurrent(null))
    }
  }

  const skip = (dir: 1 | -1) => {
    if (queue.length === 0) return
    if (mode === 'shuffle') {
      const next = pickRandom(queue, loadedId)
      if (next) startTrack(next, queue)
      return
    }
    const i = queue.findIndex((t) => t.id === loadedId)
    const base = i === -1 ? 0 : i
    const next = queue[(base + dir + queue.length) % queue.length]
    if (next) startTrack(next, queue)
  }

  // Header button: turn on all-genre shuffle. Never interrupt the current
  // song — just widen the queue to every genre and switch to shuffle mode.
  // Only start playback if nothing is loaded yet.
  const mixAllGenres = () => {
    const everything = allTracks(categories)
    if (everything.length === 0) return
    setMode('shuffle')
    if (!loadedId) {
      const shuffled = shuffle(everything)
      startTrack(shuffled[0], shuffled)
      return
    }
    // Keep the current track playing; queue the rest of the library after it.
    const rest = shuffle(everything.filter((t) => t.id !== loadedId))
    const currentTrack = everything.find((t) => t.id === loadedId)
    setQueue(currentTrack ? [currentTrack, ...rest] : shuffle(everything))
  }

  // Cycle play mode without interrupting the current track.
  const cycleMode = () => {
    setMode((m) => MODE_ORDER[(MODE_ORDER.indexOf(m) + 1) % MODE_ORDER.length])
  }

  const seekTo = (value: number) => {
    const audio = audioRef.current
    if (audio) audio.currentTime = value
    setTime(value)
  }

  // Keep the ended-handler pointed at fresh state; behavior depends on mode.
  useEffect(() => {
    advanceRef.current = () => {
      const audio = audioRef.current
      if (!audio) return
      if (mode === 'repeat' && loadedId) {
        audio.currentTime = 0
        audio.play().then(() => setCurrent(loadedId)).catch(() => {})
        return
      }
      if (queue.length === 0) return
      if (mode === 'shuffle') {
        const next = pickRandom(queue, loadedId)
        if (next) startTrack(next, queue)
        return
      }
      const i = queue.findIndex((t) => t.id === loadedId)
      const next = queue[(i + 1 + queue.length) % queue.length]
      if (next) startTrack(next, queue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, loadedId, mode])

  const nowPlaying =
    queue.find((t) => t.id === loadedId) ??
    allTracks(categories).find((t) => t.id === loadedId) ??
    null

  const value: MusicContextValue = {
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
    mixAllGenres,
    seekTo,
    setSeeking: (v: boolean) => (seekingRef.current = v),
    setTime,
  }

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
}

export function useMusic() {
  const ctx = useContext(MusicContext)
  if (!ctx) throw new Error('useMusic must be used within MusicProvider')
  return ctx
}
