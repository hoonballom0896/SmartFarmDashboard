import { isSupabaseConfigured, supabase } from './supabase'

export const MUSIC_BUCKET = 'music'

export type MusicTrack = {
  id: string // full path, e.g. "kpop/song.mp3"
  name: string
  mood: string // category label
  src: string
}

export type MusicCategory = {
  id: string
  name: string
  tracks: MusicTrack[]
}

export type LibraryResult = { categories: MusicCategory[]; error: string | null }

const AUDIO_RE = /\.(mp3|m4a|aac|ogg|oga|wav|flac|webm)$/i

// Friendly labels for the known genre folders.
const CATEGORY_LABELS: Record<string, string> = {
  balad: '발라드',
  ballad: '발라드',
  bandmusic: '밴드',
  hiphop: '힙합',
  jpop: 'J-POP',
  kpop: 'K-POP',
  meammusic: '무드',
  pop: '팝',
}

function prettyName(fileName: string) {
  const base = fileName.split('/').pop() ?? fileName
  return base.replace(AUDIO_RE, '').replace(/[_-]+/g, ' ').trim() || base
}

function prettyCategory(folder: string) {
  return CATEGORY_LABELS[folder.toLowerCase()] ?? folder.charAt(0).toUpperCase() + folder.slice(1)
}

function publicUrl(path: string) {
  return supabase.storage.from(MUSIC_BUCKET).getPublicUrl(path).data.publicUrl
}

/**
 * Read the `music` bucket as genre folders, each with its audio files.
 * A missing SELECT policy returns an empty list with no error (see SQL notes).
 */
export async function loadMusicLibrary(): Promise<LibraryResult> {
  if (!isSupabaseConfigured) {
    return { categories: [], error: 'Supabase가 연결되지 않았어요' }
  }

  const { data: root, error } = await supabase.storage
    .from(MUSIC_BUCKET)
    .list('', { limit: 200, sortBy: { column: 'name', order: 'asc' } })

  if (error) {
    return { categories: [], error: `'${MUSIC_BUCKET}' 버킷을 읽지 못했어요: ${error.message}` }
  }
  if (!root || root.length === 0) {
    return { categories: [], error: "곡이 없거나 'music' 버킷 읽기 권한이 없어요" }
  }

  // Folders come back with a null id; files carry metadata.
  const folders = root.filter((e) => e.id === null)
  const rootFiles = root.filter((e) => e.id !== null && AUDIO_RE.test(e.name))

  const categories: MusicCategory[] = []

  for (const folder of folders) {
    const { data: inner } = await supabase.storage
      .from(MUSIC_BUCKET)
      .list(folder.name, { limit: 500, sortBy: { column: 'name', order: 'asc' } })
    const files = (inner ?? []).filter((f) => f.id !== null && AUDIO_RE.test(f.name))
    if (files.length === 0) continue
    categories.push({
      id: folder.name,
      name: prettyCategory(folder.name),
      tracks: files.map((f) => {
        const path = `${folder.name}/${f.name}`
        return { id: path, name: prettyName(f.name), mood: prettyCategory(folder.name), src: publicUrl(path) }
      }),
    })
  }

  if (rootFiles.length > 0) {
    categories.unshift({
      id: '_root',
      name: '기타',
      tracks: rootFiles.map((f) => ({
        id: f.name,
        name: prettyName(f.name),
        mood: '기타',
        src: publicUrl(f.name),
      })),
    })
  }

  return {
    categories,
    error: categories.length ? null : '재생 가능한 오디오 파일을 찾지 못했어요',
  }
}

/** Flatten every track across categories (used for mixup / shuffle). */
export function allTracks(categories: MusicCategory[]): MusicTrack[] {
  return categories.flatMap((c) => c.tracks)
}

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
