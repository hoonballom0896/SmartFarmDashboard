import { isSupabaseConfigured, supabase } from './supabase'

/** Mirrors the `settings` table the smart-farm control panel writes to. */
export type FarmSettings = {
  target_stage: number
  led_brightness: number
  target_temp: number
}

const ROW_ID = 1

export async function fetchFarmSettings(): Promise<FarmSettings | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('settings')
    .select('target_stage, led_brightness, target_temp')
    .eq('id', ROW_ID)
    .maybeSingle()
  if (error || !data) return null
  return data as FarmSettings
}

/**
 * Subscribe to live changes on the `settings` row. Returns an unsubscribe fn.
 * Requires `ALTER PUBLICATION supabase_realtime ADD TABLE settings;` (see SQL.txt).
 */
export function subscribeFarmSettings(
  onChange: (s: FarmSettings) => void,
): () => void {
  if (!isSupabaseConfigured) return () => {}
  const channel = supabase
    .channel('farm-settings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'settings', filter: `id=eq.${ROW_ID}` },
      (payload) => {
        const row = payload.new as Partial<FarmSettings> | null
        if (row && 'target_stage' in row) onChange(row as FarmSettings)
      },
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

/** Push app-side changes back so the panel and app stay in sync. */
export async function pushFarmSettings(patch: Partial<FarmSettings>): Promise<void> {
  if (!isSupabaseConfigured) return
  await supabase
    .from('settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', ROW_ID)
}
