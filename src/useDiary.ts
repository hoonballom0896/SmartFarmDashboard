import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured } from './lib/supabase'
import {
  addDiaryEntry,
  clearDiary,
  loadDiaryEntries,
  type DiaryEntry,
} from './lib/diaryStore'

export function useDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    loadDiaryEntries()
      .then((rows) => alive && setEntries(rows))
      .catch((e) => alive && setError(e?.message ?? '불러오기에 실패했어요'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const add = useCallback(
    async (input: { title: string; body: string; photo: Blob | null }) => {
      setError(null)
      const entry = await addDiaryEntry(input)
      setEntries((prev) => [entry, ...prev])
      return entry
    },
    [],
  )

  const clearAll = useCallback(async () => {
    setError(null)
    await clearDiary()
    setEntries([])
  }, [])

  return { entries, loading, error, configured: isSupabaseConfigured, add, clearAll }
}
