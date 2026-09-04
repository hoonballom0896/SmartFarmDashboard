import { isSupabaseConfigured, supabase } from './supabase'

export const DIARY_BUCKET = 'diary-images'
export const FARM_BUCKET = 'farm-photos'
const MANIFEST = 'entries.json'
const SIGNED_TTL = 60 * 60 * 24 * 7 // 7 days

export type DiaryEntry = {
  id: string
  date: string
  title: string
  body: string
  imagePath: string // path within the diary bucket ('' when no photo)
  photo: string // signed display URL (resolved at load time)
}

type ManifestEntry = Omit<DiaryEntry, 'photo'>

async function signedUrl(bucket: string, path: string): Promise<string> {
  if (!path) return ''
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_TTL)
  return data?.signedUrl ?? ''
}

async function readManifest(): Promise<ManifestEntry[]> {
  const { data, error } = await supabase.storage.from(DIARY_BUCKET).download(MANIFEST)
  if (error || !data) return []
  try {
    const parsed = JSON.parse(await data.text())
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeManifest(entries: ManifestEntry[]): Promise<void> {
  const blob = new Blob([JSON.stringify(entries)], { type: 'application/json' })
  const { error } = await supabase.storage
    .from(DIARY_BUCKET)
    .upload(MANIFEST, blob, { upsert: true, contentType: 'application/json' })
  if (error) throw error
}

/** Load all diary entries (newest first) with fresh signed photo URLs. */
export async function loadDiaryEntries(): Promise<DiaryEntry[]> {
  if (!isSupabaseConfigured) return []
  const manifest = await readManifest()
  const withUrls = await Promise.all(
    manifest.map(async (e) => ({ ...e, photo: await signedUrl(DIARY_BUCKET, e.imagePath) })),
  )
  return withUrls
}

function extOf(blob: Blob): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[blob.type] ?? 'jpg'
}

/** Upload a photo (if any), append the entry to the manifest, return the entry. */
export async function addDiaryEntry(input: {
  title: string
  body: string
  photo: Blob | null
}): Promise<DiaryEntry> {
  const id = crypto.randomUUID()
  let imagePath = ''

  if (input.photo) {
    imagePath = `${id}.${extOf(input.photo)}`
    const { error } = await supabase.storage
      .from(DIARY_BUCKET)
      .upload(imagePath, input.photo, { contentType: input.photo.type || 'image/jpeg' })
    if (error) throw error
  }

  const manifestEntry: ManifestEntry = {
    id,
    date: new Date().toISOString().slice(0, 10),
    title: input.title,
    body: input.body,
    imagePath,
  }

  const manifest = await readManifest()
  await writeManifest([manifestEntry, ...manifest])

  return { ...manifestEntry, photo: await signedUrl(DIARY_BUCKET, imagePath) }
}

/** Wipe every object in the diary bucket (photos + manifest). */
export async function clearDiary(): Promise<void> {
  if (!isSupabaseConfigured) return
  const { data, error } = await supabase.storage.from(DIARY_BUCKET).list('', { limit: 1000 })
  if (error) throw error
  const paths = (data ?? []).map((f) => f.name).filter((n) => n && !n.endsWith('/'))
  if (paths.length) {
    const { error: rmErr } = await supabase.storage.from(DIARY_BUCKET).remove(paths)
    if (rmErr) throw rmErr
  }
}

const IMAGE_RE = /\.(png|jpe?g|webp|gif|bmp|heic|heif|avif)$/i

/** Pull the most recent photo the smart farm dropped into `farm-photos`. */
export async function latestFarmPhoto(): Promise<{ url: string; blob: Blob } | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.storage
    .from(FARM_BUCKET)
    .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) throw new Error(`'${FARM_BUCKET}' 버킷을 읽지 못했어요: ${error.message}`)
  if (!data || data.length === 0) {
    throw new Error("'farm-photos' 버킷이 비었거나 읽기 권한이 없어요")
  }
  // Skip folders and Supabase's placeholder object; keep real image files.
  const file = data.find(
    (f) => f.id !== null && IMAGE_RE.test(f.name) && f.name !== '.emptyFolderPlaceholder',
  )
  if (!file) throw new Error('스마트팜 사진을 찾지 못했어요')
  const { data: blob, error: dlErr } = await supabase.storage.from(FARM_BUCKET).download(file.name)
  if (dlErr || !blob) {
    throw new Error(`사진을 내려받지 못했어요: ${dlErr?.message ?? '알 수 없는 오류'}`)
  }
  return { url: URL.createObjectURL(blob), blob }
}
