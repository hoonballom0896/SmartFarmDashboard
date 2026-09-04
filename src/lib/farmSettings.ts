import { isSupabaseConfigured, supabase } from './supabase'
import type { PlantId, SensorId } from '../farm'

/** Mirrors the `settings` table the smart-farm control panel writes to. */
export type FarmSettings = {
  target_stage: number
  led_brightness: number
  target_temp: number
  water_level: number
  soil_moisture: number
  light_lux: number
  co2_ppm: number
  humidity: number
  plant: PlantId
}

/** Maps an in-app sensor dial to its column in the `settings` table. */
export const SENSOR_COLUMN: Record<SensorId, keyof FarmSettings> = {
  water: 'water_level',
  soil: 'soil_moisture',
  light: 'light_lux',
  co2: 'co2_ppm',
  temp: 'target_temp',
  humidity: 'humidity',
  led: 'led_brightness',
}

const ROW_ID = 1

const COLUMNS =
  'target_stage, led_brightness, target_temp, water_level, soil_moisture, light_lux, co2_ppm, humidity, plant'

export async function fetchFarmSettings(): Promise<Partial<FarmSettings> | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('settings')
    .select(COLUMNS)
    .eq('id', ROW_ID)
    .maybeSingle()
  if (error || !data) return null
  return data as Partial<FarmSettings>
}

/**
 * Subscribe to live changes on the `settings` row. Returns an unsubscribe fn.
 * Requires `ALTER PUBLICATION supabase_realtime ADD TABLE settings;` (see SQL.txt).
 */
export function subscribeFarmSettings(
  onChange: (s: Partial<FarmSettings>) => void,
  onStatus?: (ok: boolean) => void,
): () => void {
  if (!isSupabaseConfigured) return () => {}
  const channel = supabase
    .channel('farm-settings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'settings', filter: `id=eq.${ROW_ID}` },
      (payload) => {
        const row = payload.new as Partial<FarmSettings> | null
        if (row) onChange(row)
      },
    )
    .subscribe((status, err) => {
      // Surface why realtime isn't delivering: SUBSCRIBED = OK,
      // CHANNEL_ERROR/TIMED_OUT usually means the table is not in the
      // supabase_realtime publication or RLS blocks the anon SELECT.
      console.info('[farm realtime]', status, err ?? '')
      onStatus?.(status === 'SUBSCRIBED')
    })
  return () => {
    supabase.removeChannel(channel)
  }
}

/** Push app-side changes back so the panel and app stay in sync. */
export async function pushFarmSettings(patch: Partial<FarmSettings>): Promise<void> {
  if (!isSupabaseConfigured) return
  // upsert (not update) so a missing id=1 row is created instead of matching
  // nothing. `.select()` returns the affected rows so we can detect RLS blocks.
  const { data, error } = await supabase
    .from('settings')
    .upsert({ id: ROW_ID, ...patch, updated_at: new Date().toISOString() } as never, {
      onConflict: 'id',
    })
    .select()
  if (error) {
    console.error('[farm push] 저장 실패:', error.message, error)
  } else if (!data || data.length === 0) {
    console.warn(
      '[farm push] 0개 행이 바뀜 — RLS UPDATE/INSERT 정책이 없거나 권한이 막혀 있어요',
    )
  } else {
    console.info('[farm push] 저장됨:', patch)
  }
}

/** Convenience: push a single sensor dial's value to its column. */
export async function pushSensor(id: SensorId, value: number): Promise<void> {
  const column = SENSOR_COLUMN[id]
  const rounded = id === 'temp' ? value : Math.round(value)
  await pushFarmSettings({ [column]: rounded } as Partial<FarmSettings>)
}
